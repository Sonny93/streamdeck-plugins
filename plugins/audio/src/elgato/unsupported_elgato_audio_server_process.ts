import type { ElgatoAudioServerProcess } from './elgato_audio_server_process';
import { ElgatoAudioUnsupportedError } from './elgato_audio_unsupported_error';

/** The Elgato audio server process of a system that has none: it never runs and nothing is spawned. */
export const unsupportedElgatoAudioServerProcess: ElgatoAudioServerProcess = {
	isSupported: false,
	isRunning: () => Promise.reject(new ElgatoAudioUnsupportedError()),
	kill: () => Promise.reject(new ElgatoAudioUnsupportedError()),
};
