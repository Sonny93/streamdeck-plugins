import type { Scheduler } from 'deck-kit/async/scheduler';

import type { DesiredUnitState } from '../daikin/unit_types';
import { mergePatches } from './merge_patches';

type Waiter = Readonly<{
	resolve: () => void;
	reject: (error: unknown) => void;
}>;

type PatchBatch = { patch: DesiredUnitState; waiters: Waiter[] };

export type PatchWriterOptions = Readonly<{
	schedule: Scheduler;
	write: (patch: DesiredUnitState) => Promise<void>;
	onChange: () => void;
}>;

/**
 * Turns bursts of change requests into single writes: requests merge into one pending patch (the latest value of each field wins),
 * which is written once no request came for the quiet period. A request that arrives during a write starts the next pending patch,
 * written after that write and its own quiet period. A failed write drops everything waiting and rejects every request involved.
 */
export class PatchWriter {
	private pending: PatchBatch | undefined;
	private inFlight: PatchBatch | undefined;
	private cancelQuiet: (() => void) | undefined;
	private idleWaiters: (() => void)[] = [];

	constructor(private readonly options: PatchWriterOptions) {}

	/** The patches not confirmed by the unit yet, the one being written first. */
	get unsentPatches(): readonly DesiredUnitState[] {
		return [this.inFlight?.patch, this.pending?.patch].filter(
			(patch) => patch !== undefined
		);
	}

	get hasUnsentChange(): boolean {
		return this.inFlight !== undefined || this.pending !== undefined;
	}

	/** Resolves once nothing is pending or being written: at once when that is already so. */
	settled(): Promise<void> {
		if (!this.hasUnsentChange) {
			return Promise.resolve();
		}
		return new Promise((resolve) => {
			this.idleWaiters.push(resolve);
		});
	}

	/** Resolves once the patch holding this request is written, rejects when that write fails. */
	request(
		patch: Readonly<DesiredUnitState>,
		quietMilliseconds: number
	): Promise<void> {
		return new Promise((resolve, reject) => {
			const batch = this.pending ?? { patch: {}, waiters: [] };
			batch.patch = mergePatches(batch.patch, patch);
			batch.waiters.push({ resolve, reject });
			this.pending = batch;
			this.options.onChange();
			this.restartQuietTimer(quietMilliseconds);
		});
	}

	/** Drops the pending patch, not the one being written, and rejects its requests. */
	discardPending(error: unknown): void {
		this.cancelQuiet?.();
		this.cancelQuiet = undefined;
		const batch = this.pending;
		this.pending = undefined;
		batch?.waiters.forEach((waiter) => {
			waiter.reject(error);
		});
		this.releaseIdleWaiters();
	}

	private releaseIdleWaiters(): void {
		if (this.hasUnsentChange) {
			return;
		}
		const waiters = this.idleWaiters;
		this.idleWaiters = [];
		waiters.forEach((resolve) => {
			resolve();
		});
	}

	private restartQuietTimer(quietMilliseconds: number): void {
		this.cancelQuiet?.();
		this.cancelQuiet = this.options.schedule(() => {
			this.cancelQuiet = undefined;
			void this.flush();
		}, quietMilliseconds);
	}

	/** Never rejects: it runs detached from a timer. */
	private async flush(): Promise<void> {
		const batch = this.pending;
		if (this.inFlight !== undefined || batch === undefined) {
			return;
		}
		this.pending = undefined;
		this.inFlight = batch;
		try {
			await this.options.write(batch.patch);
		} catch (error) {
			this.inFlight = undefined;
			this.discardPending(error);
			batch.waiters.forEach((waiter) => {
				waiter.reject(error);
			});
			this.options.onChange();
			this.releaseIdleWaiters();
			return;
		}
		this.inFlight = undefined;
		batch.waiters.forEach((waiter) => {
			waiter.resolve();
		});
		this.options.onChange();
		if (this.cancelQuiet === undefined) {
			await this.flush();
		}
		this.releaseIdleWaiters();
	}
}
