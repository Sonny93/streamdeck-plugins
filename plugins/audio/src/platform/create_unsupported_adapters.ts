import { AudioTiming } from '../audio/audio_timing';
import { unsupportedElgatoAudioServerProcess } from '../elgato/unsupported_elgato_audio_server_process';
import type { PlatformAdapters } from './platform_adapters';
import { UnsupportedPlatformError } from './unsupported_platform_error';

/** Adapters of a system the plugin does not support: every read and write rejects, so the keys show as unavailable. */
export function createUnsupportedAdapters(platform: string): PlatformAdapters {
	const fail = (): Promise<never> =>
		Promise.reject(new UnsupportedPlatformError(platform));
	return {
		audio: {
			loadCoreAudio: fail,
			pollIntervalMilliseconds: AudioTiming.unsupportedPollIntervalMilliseconds,
		},
		openVoltConnection: fail,
		elgatoAudioServerProcess: unsupportedElgatoAudioServerProcess,
	};
}
