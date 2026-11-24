import type { Scheduler } from 'deck-kit/async/scheduler';

import { ListenTiming } from './listen_timing';
import type { ListenWatchdog } from './listen_watchdog';
import { roundListenLevel } from './round_listen_level';
import type { SerialQueue } from './serial_queue';
import type { SourceListening } from './source_listening';

type ListenLevelDriverOptions = Readonly<{
	listening: SourceListening;
	queue: SerialQueue;
	schedule: Scheduler;
	watchdog: ListenWatchdog;
	readTarget: (sourceId: string) => number | undefined;
	isListened: (sourceId: string) => boolean;
	/** Called inside the queue when a level could not be applied, to cut the source. */
	onFailure: (sourceId: string, error: unknown) => Promise<void>;
	onError: (error: unknown) => void;
}>;

type LevelStep = Readonly<{
	target: number;
	level: number;
	isUpward: boolean;
}>;

/**
 * Brings the level of a listened source to its target, always toward the latest one.
 * Down goes in one move; up goes one step per interval, and the allowed level of the watchdog follows each move.
 */
export class ListenLevelDriver {
	private readonly driving = new Set<string>();
	private readonly cancelWaits = new Map<string, () => void>();

	constructor(private readonly options: ListenLevelDriverOptions) {}

	drive(sourceId: string): void {
		if (!this.driving.has(sourceId)) {
			this.driving.add(sourceId);
			this.enqueueStep(sourceId);
			return;
		}
		const cancelWait = this.cancelWaits.get(sourceId);
		if (
			cancelWait !== undefined &&
			this.planStep(sourceId)?.isUpward === false
		) {
			cancelWait();
			this.cancelWaits.delete(sourceId);
			this.enqueueStep(sourceId);
		}
	}

	private enqueueStep(sourceId: string): void {
		this.options.queue
			.enqueue(() => this.step(sourceId))
			.catch(this.options.onError);
	}

	private async step(sourceId: string): Promise<void> {
		const plan = this.planStep(sourceId);
		if (plan === undefined) {
			this.driving.delete(sourceId);
			return;
		}
		try {
			await this.apply(sourceId, plan);
		} catch (error) {
			this.driving.delete(sourceId);
			await this.options.onFailure(sourceId, error);
			return;
		}
		this.continueAfter(sourceId, plan);
	}

	private planStep(sourceId: string): LevelStep | undefined {
		const guard = this.options.watchdog.get(sourceId);
		const target = this.options.readTarget(sourceId);
		if (
			guard === undefined ||
			target === undefined ||
			!this.options.isListened(sourceId)
		) {
			return undefined;
		}
		const current = roundListenLevel(guard.allowedLevel);
		if (target === current) {
			return undefined;
		}
		if (target < current) {
			return { target, level: target, isUpward: false };
		}
		const level = Math.min(
			target,
			roundListenLevel(current + ListenTiming.levelStep)
		);
		return { target, level, isUpward: true };
	}

	private async apply(sourceId: string, step: LevelStep): Promise<void> {
		const guard = this.options.watchdog.get(sourceId);
		if (guard === undefined) {
			return;
		}
		if (step.isUpward) {
			guard.allowedLevel = step.level;
			await this.options.listening.setLevel(sourceId, step.level);
			return;
		}
		await this.options.listening.setLevel(sourceId, step.level);
		guard.allowedLevel = step.level;
	}

	private continueAfter(sourceId: string, step: LevelStep): void {
		if (!step.isUpward || step.level >= step.target) {
			this.enqueueStep(sourceId);
			return;
		}
		this.cancelWaits.set(
			sourceId,
			this.options.schedule(() => {
				this.cancelWaits.delete(sourceId);
				this.enqueueStep(sourceId);
			}, ListenTiming.upwardStepIntervalMilliseconds)
		);
	}
}
