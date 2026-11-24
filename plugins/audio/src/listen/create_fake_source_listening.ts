import { buildLoopback } from './build_loopback';
import type { ListenSource } from './listen_source';
import type { Loopback } from './loopback';
import type { SourceListening } from './source_listening';

export type FakeListeningCall = Readonly<{
	name:
		| 'readState'
		| 'startListening'
		| 'stopListening'
		| 'unloadLoopback'
		| 'setLevel';
	sourceId?: string;
	level?: number;
	moduleIndex?: number;
}>;

type FakeListeningState = {
	sources: ListenSource[];
	loopbacks: Loopback[];
};

type FakeListeningControls = {
	/** Makes every `setLevel` fail with it. */
	setLevelError: Error | undefined;
	/** Makes every `setLevel` wait for it before it applies. */
	setLevelGate: Promise<void> | undefined;
};

export type FakeSourceListening = Readonly<{
	listening: SourceListening;
	/** What the system holds; tests change it to play what happens outside the plugin. */
	state: FakeListeningState;
	controls: FakeListeningControls;
	calls: FakeListeningCall[];
	emitChange: () => void;
	watcherCount: () => number;
}>;

function replaceSource(
	state: FakeListeningState,
	sourceId: string,
	changes: Partial<ListenSource>
): void {
	state.sources = state.sources.map((source) =>
		source.id === sourceId ? { ...source, ...changes } : source
	);
}

function removeLoopbacks(
	state: FakeListeningState,
	isRemoved: (loopback: Loopback) => boolean
): void {
	state.loopbacks = state.loopbacks.filter((loopback) => !isRemoved(loopback));
}

/** A `SourceListening` on an in-memory system: starting loads a tagged loopback, setting a level changes the source. */
export function createFakeSourceListening(
	sources: readonly ListenSource[]
): FakeSourceListening {
	const state: FakeListeningState = { sources: [...sources], loopbacks: [] };
	const controls: FakeListeningControls = {
		setLevelError: undefined,
		setLevelGate: undefined,
	};
	const calls: FakeListeningCall[] = [];
	const watchers = new Set<() => void>();
	let nextModuleIndex = 1;

	const listening: SourceListening = {
		readState: () => {
			calls.push({ name: 'readState' });
			return Promise.resolve({
				sources: [...state.sources],
				loopbacks: [...state.loopbacks],
			});
		},
		startListening: (sourceId, level) => {
			calls.push({ name: 'startListening', sourceId, level });
			replaceSource(state, sourceId, { loudestLevel: level });
			const hasHandLoopback = state.loopbacks.some(
				(loopback) =>
					!loopback.isPluginLoopback &&
					(loopback.requestedSourceId === sourceId ||
						loopback.linkedSourceId === sourceId)
			);
			if (hasHandLoopback) {
				return Promise.resolve(undefined);
			}
			const moduleIndex = nextModuleIndex++;
			state.loopbacks = [
				...state.loopbacks,
				buildLoopback({
					moduleIndex,
					requestedSourceId: sourceId,
					linkedSourceId: sourceId,
					isPluginLoopback: true,
				}),
			];
			return Promise.resolve(moduleIndex);
		},
		stopListening: (sourceId) => {
			calls.push({ name: 'stopListening', sourceId });
			removeLoopbacks(
				state,
				(loopback) =>
					loopback.requestedSourceId === sourceId ||
					loopback.linkedSourceId === sourceId
			);
			return Promise.resolve();
		},
		unloadLoopback: (moduleIndex) => {
			calls.push({ name: 'unloadLoopback', moduleIndex });
			removeLoopbacks(
				state,
				(loopback) => loopback.moduleIndex === moduleIndex
			);
			return Promise.resolve();
		},
		unloadLoopbacksNow: (moduleIndexes) => {
			removeLoopbacks(state, (loopback) =>
				moduleIndexes.includes(loopback.moduleIndex)
			);
		},
		setLevel: async (sourceId, level) => {
			calls.push({ name: 'setLevel', sourceId, level });
			await controls.setLevelGate;
			if (controls.setLevelError !== undefined) {
				throw controls.setLevelError;
			}
			replaceSource(state, sourceId, { loudestLevel: level });
		},
		watchChanges: (onChange) => {
			watchers.add(onChange);
			return () => {
				watchers.delete(onChange);
			};
		},
	};

	return {
		listening,
		state,
		controls,
		calls,
		emitChange: () => {
			for (const watcher of watchers) {
				watcher();
			}
		},
		watcherCount: () => watchers.size,
	};
}
