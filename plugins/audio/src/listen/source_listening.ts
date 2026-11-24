import type { AudioChangeWatcher } from '../audio/audio_change_watcher';
import type { ListenState } from './listen_state';

/**
 * Plays an input in the default output through a loopback, built by the platform (Linux: `pactl`).
 * Every operation reads the system fresh: none trusts a state read earlier.
 */
export type SourceListening = Readonly<{
	readState: () => Promise<ListenState>;
	/**
	 * Sets the volume of the source, checks it on its loudest channel, and only then loads a tagged loopback; only sets the volume when one is already loaded.
	 * Resolves with the module index of the plugin loopback, `undefined` when it only set the level of a loopback loaded by hand, which the plugin never owns.
	 * It throws, leaving no loopback of its own behind, when the source is not a listed hardware input,
	 * the level does not apply, or the loaded loopback is not linked to that source.
	 */
	startListening: (
		sourceId: string,
		level: number
	) => Promise<number | undefined>;
	/** Unloads every loopback whose requested or linked source is this one, and leaves the other modules loaded. */
	stopListening: (sourceId: string) => Promise<void>;
	/** Unloads one loopback by its module index. */
	unloadLoopback: (moduleIndex: number) => Promise<void>;
	/** Unloads loopbacks synchronously, for the exit of the process where nothing asynchronous runs any more; it never throws. */
	unloadLoopbacksNow: (moduleIndexes: readonly number[]) => void;
	/** Sets the volume of the source and resolves once a read shows its loudest channel at or below the level; throws otherwise. */
	setLevel: (sourceId: string, level: number) => Promise<void>;
	/** Reports changes of the sources, of the loaded modules and of the loopback streams. */
	watchChanges: AudioChangeWatcher;
}>;
