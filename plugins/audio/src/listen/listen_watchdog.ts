import { findGuardViolation } from './find_guard_violation';
import { findHandLoopbackViolation } from './find_hand_loopback_violation';
import { findOwnedLoopbackViolation } from './find_owned_loopback_violation';
import type { ListenCutReason } from './listen_cut_reason';
import type { ListenGuard } from './listen_guard';
import type { ListenSource } from './listen_source';
import { ListenSourceCutError } from './listen_source_cut_error';
import type { ListenState } from './listen_state';
import { ListenStrayLoopbackError } from './listen_stray_loopback_error';
import type { Loopback } from './loopback';
import type { SourceListening } from './source_listening';

type ListenWatchdogOptions = Readonly<{
	listening: SourceListening;
	onCut: (error: ListenSourceCutError) => void;
	onError: (error: unknown) => void;
}>;

/**
 * Guards every listened source and the loopbacks that play it.
 * The plugin follows its own loopbacks by module index: one that is relinked to another source or whose streams amplify is unloaded,
 * a tagged one it does not own is unloaded, and a source that gets louder than allowed, changes port or vanishes is cut.
 * It never turns a level down again, so a loud level can only end listening.
 */
export class ListenWatchdog {
	private readonly guards = new Map<string, ListenGuard>();
	private readonly ownedSourceIds = new Map<number, string>();

	constructor(private readonly options: ListenWatchdogOptions) {}

	get size(): number {
		return this.guards.size;
	}

	get ownedModuleIndexes(): readonly number[] {
		return [...this.ownedSourceIds.keys()];
	}

	get(sourceId: string): ListenGuard | undefined {
		return this.guards.get(sourceId);
	}

	/** Takes a loopback this plugin just loaded, guarding its source at the level applied; the port is learned at the next read. */
	own(moduleIndex: number, sourceId: string, level: number): void {
		this.ownedSourceIds.set(moduleIndex, sourceId);
		this.guards.set(sourceId, {
			allowedLevel: level,
			port: undefined,
			isPortKnown: false,
		});
	}

	forget(sourceId: string): void {
		this.guards.delete(sourceId);
		this.forgetOwned(sourceId);
	}

	/** Checks the read state, unloads what is unsafe, cuts what breaks a guard, and returns the ids still listened. */
	async enforce(state: ListenState): Promise<ReadonlySet<string>> {
		this.forgetGoneModules(state.loopbacks);
		const listenedIds = await this.keepSafeLoopbacks(state.loopbacks);
		this.syncGuards(listenedIds, state.sources);
		for (const sourceId of listenedIds) {
			const guard = this.guards.get(sourceId);
			const source = state.sources.find(({ id }) => id === sourceId);
			const reason =
				guard === undefined ? undefined : findGuardViolation(guard, source);
			if (reason !== undefined && (await this.cut(sourceId, reason))) {
				listenedIds.delete(sourceId);
			}
		}
		return listenedIds;
	}

	/** Stops listening to the source at once; the guard stays when the stop fails, so the next read tries again. */
	async cut(
		sourceId: string,
		reason: ListenCutReason,
		cause?: unknown
	): Promise<boolean> {
		try {
			await this.options.listening.stopListening(sourceId);
		} catch (error) {
			this.options.onError(error);
			return false;
		}
		this.forget(sourceId);
		this.options.onCut(new ListenSourceCutError(sourceId, reason, { cause }));
		return true;
	}

	private forgetOwned(sourceId: string): void {
		for (const [moduleIndex, ownedId] of this.ownedSourceIds) {
			if (ownedId === sourceId) {
				this.ownedSourceIds.delete(moduleIndex);
			}
		}
	}

	private forgetGoneModules(loopbacks: readonly Loopback[]): void {
		const loadedIndexes = new Set(
			loopbacks.map(({ moduleIndex }) => moduleIndex)
		);
		for (const moduleIndex of this.ownedSourceIds.keys()) {
			if (!loadedIndexes.has(moduleIndex)) {
				this.ownedSourceIds.delete(moduleIndex);
			}
		}
	}

	private async keepSafeLoopbacks(
		loopbacks: readonly Loopback[]
	): Promise<Set<string>> {
		const listenedIds = new Set<string>();
		for (const loopback of loopbacks) {
			const sourceId = await this.inspect(loopback);
			if (sourceId !== undefined) {
				listenedIds.add(sourceId);
			}
		}
		return listenedIds;
	}

	/** Returns the source the loopback plays, `undefined` when it was unloaded or belongs to no source. */
	private inspect(loopback: Loopback): Promise<string | undefined> {
		return loopback.isPluginLoopback
			? this.inspectPluginLoopback(loopback)
			: this.inspectHandLoopback(loopback);
	}

	private async inspectPluginLoopback(
		loopback: Loopback
	): Promise<string | undefined> {
		const sourceId = this.ownedSourceIds.get(loopback.moduleIndex);
		if (sourceId === undefined) {
			await this.unloadStray(loopback);
			return undefined;
		}
		const reason = findOwnedLoopbackViolation(loopback, sourceId);
		if (reason === undefined) {
			return sourceId;
		}
		return (await this.unloadUnsafe(loopback, sourceId, reason))
			? undefined
			: sourceId;
	}

	private async inspectHandLoopback(
		loopback: Loopback
	): Promise<string | undefined> {
		const sourceId = loopback.requestedSourceId ?? loopback.linkedSourceId;
		if (sourceId === undefined) {
			return undefined;
		}
		const reason = findHandLoopbackViolation(loopback);
		if (reason === undefined) {
			return sourceId;
		}
		return (await this.unloadUnsafe(loopback, sourceId, reason))
			? undefined
			: sourceId;
	}

	private async unloadStray(loopback: Loopback): Promise<void> {
		try {
			await this.options.listening.unloadLoopback(loopback.moduleIndex);
			this.options.onError(new ListenStrayLoopbackError(loopback.moduleIndex));
		} catch (error) {
			this.options.onError(error);
		}
	}

	private async unloadUnsafe(
		loopback: Loopback,
		sourceId: string,
		reason: ListenCutReason
	): Promise<boolean> {
		try {
			await this.options.listening.unloadLoopback(loopback.moduleIndex);
		} catch (error) {
			this.options.onError(error);
			return false;
		}
		this.ownedSourceIds.delete(loopback.moduleIndex);
		this.options.onCut(new ListenSourceCutError(sourceId, reason));
		return true;
	}

	private syncGuards(
		listenedIds: ReadonlySet<string>,
		sources: readonly ListenSource[]
	): void {
		for (const sourceId of this.guards.keys()) {
			if (!listenedIds.has(sourceId)) {
				this.guards.delete(sourceId);
			}
		}
		for (const sourceId of listenedIds) {
			const source = sources.find(({ id }) => id === sourceId);
			if (source !== undefined) {
				this.syncGuard(sourceId, source);
			}
		}
	}

	private syncGuard(sourceId: string, source: ListenSource): void {
		const guard = this.guards.get(sourceId);
		if (guard === undefined) {
			this.guards.set(sourceId, {
				allowedLevel: source.loudestLevel,
				port: source.activePort,
				isPortKnown: true,
			});
			return;
		}
		if (!guard.isPortKnown) {
			guard.port = source.activePort;
			guard.isPortKnown = true;
		}
	}
}
