import { isSameListenView } from './is_same_listen_view';
import { ListenCutReason } from './listen_cut_reason';
import type { ListenHubOptions } from './listen_hub_options';
import { ListenLevelDriver } from './listen_level_driver';
import { ListenTiming } from './listen_timing';
import type { ListenView } from './listen_view';
import { ListenWatchLoop } from './listen_watch_loop';
import { ListenWatchdog } from './listen_watchdog';
import { RememberedLevels } from './remembered_levels';
import { roundListenLevel } from './round_listen_level';
import { SerialQueue } from './serial_queue';

type ListenViewListener = (view: ListenView | undefined) => void;
type ListenCutListener = (sourceId: string) => void;

/**
 * Shares what is listened to between every action, and keeps listening safe.
 * Every use of the system goes through one queue, so no read comes between the steps of a change.
 * A listened source that gets louder than the hub allowed, changes port or vanishes is cut at the next read, never turned down again.
 */
export class ListenHub {
	private readonly queue = new SerialQueue();
	private readonly viewListeners = new Set<ListenViewListener>();
	private readonly cutListeners = new Set<ListenCutListener>();
	private readonly remembered: RememberedLevels;
	private readonly watchdog: ListenWatchdog;
	private readonly driver: ListenLevelDriver;
	private readonly watchLoop: ListenWatchLoop;
	private view: ListenView | undefined;
	private queuedRead: Promise<void> | undefined;
	private isLastReadSuccessful = false;

	constructor(private readonly options: ListenHubOptions) {
		this.remembered = new RememberedLevels({
			settings: options.settings,
			schedule: options.schedule,
			onError: options.onError,
		});
		this.watchdog = new ListenWatchdog({
			listening: options.listening,
			onCut: (error) => {
				this.options.onError(error);
				for (const listener of this.cutListeners) {
					listener(error.sourceId);
				}
			},
			onError: options.onError,
		});
		this.driver = new ListenLevelDriver({
			listening: options.listening,
			queue: this.queue,
			schedule: options.schedule,
			watchdog: this.watchdog,
			readTarget: (sourceId) => this.remembered.get(sourceId),
			isListened: (sourceId) => this.isListened(sourceId),
			onFailure: (sourceId, error) => this.cutAfterFailure(sourceId, error),
			onError: options.onError,
		});
		this.watchLoop = new ListenWatchLoop({
			watchChanges: options.listening.watchChanges,
			schedule: options.schedule,
			onTick: () => {
				void this.refresh();
			},
		});
	}

	/** Module indexes of the loopbacks this plugin loaded, for the exit handler to unload. */
	get ownedModuleIndexes(): readonly number[] {
		return this.watchdog.ownedModuleIndexes;
	}

	/** Latest view, `undefined` before the first read or while listening cannot be read. */
	get current(): ListenView | undefined {
		return this.view;
	}

	/** Registers a listener and calls it right away; watching starts with the first listener. */
	subscribe(listener: ListenViewListener): () => void {
		this.viewListeners.add(listener);
		listener(this.view);
		if (!this.watchLoop.isRunning) {
			this.watchLoop.start();
			void this.refresh();
		}
		return () => {
			this.viewListeners.delete(listener);
			this.updateWatching();
		};
	}

	/** Registers a listener called with the source id each time the watchdog or a failed level change cut a source. */
	subscribeToCuts(listener: ListenCutListener): () => void {
		this.cutListeners.add(listener);
		return () => {
			this.cutListeners.delete(listener);
		};
	}

	/** Loads the remembered levels and reads once; it never starts listening, whatever was listened before. */
	async start(): Promise<void> {
		await this.remembered.load();
		await this.refresh();
	}

	/** The level to show and to start at: the level set for the source, else the default, held under the ceiling. */
	levelOf(sourceId: string, maximumLevel: number): number {
		const level = this.remembered.get(sourceId) ?? ListenTiming.defaultLevel;
		return Math.min(level, maximumLevel);
	}

	/** Lowers the remembered level to the ceiling when it is above, and the live level of a listened source with it; it never raises anything. */
	enforceCeiling(sourceId: string, maximumLevel: number): void {
		const level = this.remembered.get(sourceId) ?? ListenTiming.defaultLevel;
		if (level <= maximumLevel) {
			return;
		}
		this.remembered.set(sourceId, maximumLevel);
		this.notifyViewListeners();
		if (this.isListened(sourceId)) {
			this.driver.drive(sourceId);
		}
	}

	/** Stops listening to the source when it is listened, else starts at its level; it rejects when that fails. */
	toggle(sourceId: string, maximumLevel: number): Promise<void> {
		return this.queue.enqueue(() =>
			this.isListened(sourceId)
				? this.stopSource(sourceId)
				: this.startSource(sourceId, maximumLevel)
		);
	}

	/** Moves the level of the source by dial ticks; a listened source follows it, a source that is not listened is not touched. */
	changeLevel(sourceId: string, ticks: number, maximumLevel: number): void {
		const level = Math.max(
			0,
			Math.min(
				maximumLevel,
				roundListenLevel(
					this.levelOf(sourceId, maximumLevel) + ticks * ListenTiming.levelStep
				)
			)
		);
		this.remembered.set(sourceId, level);
		this.notifyViewListeners();
		if (this.isListened(sourceId)) {
			this.driver.drive(sourceId);
		}
	}

	private isListened(sourceId: string): boolean {
		return this.view?.listenedSourceIds.has(sourceId) ?? false;
	}

	private async startSource(
		sourceId: string,
		maximumLevel: number
	): Promise<void> {
		const level = this.levelOf(sourceId, maximumLevel);
		const moduleIndex = await this.options.listening.startListening(
			sourceId,
			level
		);
		if (moduleIndex !== undefined) {
			this.watchdog.own(moduleIndex, sourceId, level);
		}
		await this.readAndEnforce();
	}

	private async stopSource(sourceId: string): Promise<void> {
		await this.options.listening.stopListening(sourceId);
		this.watchdog.forget(sourceId);
		await this.readAndEnforce();
	}

	private async cutAfterFailure(
		sourceId: string,
		error: unknown
	): Promise<void> {
		await this.watchdog.cut(sourceId, ListenCutReason.levelChangeFailed, error);
		await this.readAndEnforce();
	}

	private refresh(): Promise<void> {
		if (this.queuedRead !== undefined) {
			return this.queuedRead;
		}
		const read = this.queue.enqueue(() => {
			this.queuedRead = undefined;
			return this.readAndEnforce();
		});
		this.queuedRead = read;
		return read;
	}

	private async readAndEnforce(): Promise<void> {
		try {
			const state = await this.options.listening.readState();
			const listenedSourceIds = await this.watchdog.enforce(state);
			this.isLastReadSuccessful = true;
			this.publish({ sources: state.sources, listenedSourceIds });
		} catch (error) {
			this.isLastReadSuccessful = false;
			this.options.onError(error);
			this.publish(undefined);
		}
		this.updateWatching();
	}

	private updateWatching(): void {
		const isNeeded =
			!this.isLastReadSuccessful ||
			this.viewListeners.size > 0 ||
			this.watchdog.size > 0 ||
			(this.view?.listenedSourceIds.size ?? 0) > 0;
		if (isNeeded) {
			this.watchLoop.start();
			return;
		}
		this.watchLoop.stop();
	}

	private publish(view: ListenView | undefined): void {
		if (isSameListenView(this.view, view)) {
			return;
		}
		this.view = view;
		this.notifyViewListeners();
	}

	private notifyViewListeners(): void {
		for (const listener of this.viewListeners) {
			listener(this.view);
		}
	}
}
