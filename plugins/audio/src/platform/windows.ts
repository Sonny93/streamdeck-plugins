import { AudioTiming } from '../audio/audio_timing';
import { loadCoreAudio } from '../audio/load_core_audio';
import { windowsElgatoAudioServerProcess } from '../elgato/windows_elgato_audio_server_process';
import { openVoltConnection } from '../volt/open_volt_connection';
import type { PlatformAdapters } from './platform_adapters';

/** Windows: Core Audio, the Volt 1 through HID file handles and the Elgato server through `tasklist`, all by koffi or system tools. */
export const windowsAdapters: PlatformAdapters = {
	audio: {
		loadCoreAudio,
		pollIntervalMilliseconds: AudioTiming.pollIntervalMilliseconds,
	},
	openVoltConnection,
	elgatoAudioServerProcess: windowsElgatoAudioServerProcess,
};
