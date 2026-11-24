import { scheduleTimeout } from 'deck-kit/async/schedule_timeout';
import type { Scheduler } from 'deck-kit/async/scheduler';
import { runCommand, type CommandRunner } from 'deck-kit/process/run_command';

import { AudioTiming } from '../../audio/audio_timing';
import type { SourceListening } from '../../listen/source_listening';
import { createPactlEventWatcher } from '../create_pactl_event_watcher';
import { isListenPactlEvent } from '../is_listen_pactl_event';
import { spawnPactlSubscribe } from '../spawn_pactl_subscribe';
import type { SpawnPactlSubscribeOptions } from '../spawn_pactl_subscribe_options';
import type { ListenContext } from './listen_context';
import { ListenSettings } from './listen_settings';
import { readListenState } from './read_listen_state';
import { setSourceLevel } from './set_source_level';
import { startListening } from './start_listening';
import { stopListening } from './stop_listening';
import { unloadLoopback } from './unload_loopback';
import {
	unloadLoopbacksNow,
	type SyncCommandRunner,
} from './unload_loopbacks_now';

function withTimeout(run: CommandRunner): CommandRunner {
	return (commandOptions) =>
		run({
			timeoutMilliseconds: ListenSettings.commandTimeoutMilliseconds,
			...commandOptions,
		});
}

/**
 * Listening on Linux through `pactl` (PipeWire with pipewire-pulse): a loopback from a hardware input to the default output.
 * No id reaches `pactl` unless a fresh listing holds it, and a loopback is unloaded when any check after loading fails.
 */
export function createLinuxSourceListening(
	options: Readonly<{
		runCommand?: CommandRunner;
		runCommandSync?: SyncCommandRunner;
		schedule?: Scheduler;
		spawnSubscribe?: (options: SpawnPactlSubscribeOptions) => () => void;
	}> = {}
): SourceListening {
	const schedule = options.schedule ?? scheduleTimeout;
	const context: ListenContext = {
		run: withTimeout(options.runCommand ?? runCommand),
		schedule,
	};
	return {
		readState: () => readListenState(context),
		startListening: (sourceId, level) =>
			startListening(context, sourceId, level),
		stopListening: (sourceId) => stopListening(context, sourceId),
		unloadLoopback: (moduleIndex) => unloadLoopback(context, moduleIndex),
		unloadLoopbacksNow: (moduleIndexes) => {
			unloadLoopbacksNow(moduleIndexes, options.runCommandSync);
		},
		setLevel: (sourceId, level) => setSourceLevel(context, sourceId, level),
		watchChanges: createPactlEventWatcher({
			spawnSubscribe: options.spawnSubscribe ?? spawnPactlSubscribe,
			schedule,
			initialBackoffMilliseconds: AudioTiming.watchRestartDelayMilliseconds,
			maxBackoffMilliseconds: AudioTiming.watchRestartMaxDelayMilliseconds,
			isRelevant: isListenPactlEvent,
		}),
	};
}
