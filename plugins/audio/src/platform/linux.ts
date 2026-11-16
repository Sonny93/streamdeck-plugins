import { scheduleTimeout } from 'deck-kit/async/schedule_timeout';

import { AudioTiming } from '../audio/audio_timing';
import { unsupportedElgatoAudioServerProcess } from '../elgato/unsupported_elgato_audio_server_process';
import { createLinuxCoreAudio } from '../linux/create_linux_core_audio';
import { createPactlEventWatcher } from '../linux/create_pactl_event_watcher';
import { openLinuxVoltConnection } from '../linux/open_linux_volt_connection';
import { spawnPactlSubscribe } from '../linux/spawn_pactl_subscribe';
import type { PlatformAdapters } from './platform_adapters';

const coreAudio = createLinuxCoreAudio();

/** Linux: audio through `pactl`, the Volt 1 through `/dev/hidraw`, no Elgato server; nothing here loads koffi. */
export const linuxAdapters: PlatformAdapters = {
	audio: {
		loadCoreAudio: () => Promise.resolve(coreAudio),
		pollIntervalMilliseconds: AudioTiming.safetyPollIntervalMilliseconds,
		watchChanges: createPactlEventWatcher({
			spawnSubscribe: spawnPactlSubscribe,
			schedule: scheduleTimeout,
			initialBackoffMilliseconds: AudioTiming.watchRestartDelayMilliseconds,
			maxBackoffMilliseconds: AudioTiming.watchRestartMaxDelayMilliseconds,
		}),
	},
	openVoltConnection: () => openLinuxVoltConnection(),
	elgatoAudioServerProcess: unsupportedElgatoAudioServerProcess,
};
