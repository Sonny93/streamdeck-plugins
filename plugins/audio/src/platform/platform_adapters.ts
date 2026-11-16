import type { AudioChangeWatcher } from '../audio/audio_change_watcher';
import type { CoreAudio } from '../audio/core_audio';
import type { ElgatoAudioServerProcess } from '../elgato/elgato_audio_server_process';
import type { VoltConnection } from '../volt/volt_connection';

/** The parts of the plugin that depend on the operating system, built by `windows.ts`, `linux.ts` or `unsupported.ts`. */
export type PlatformAdapters = Readonly<{
	audio: Readonly<{
		loadCoreAudio: () => Promise<CoreAudio>;
		/** Delay between two reads of the devices; a platform with a change watcher can poll slowly. */
		pollIntervalMilliseconds: number;
		watchChanges?: AudioChangeWatcher;
	}>;
	openVoltConnection: () => Promise<VoltConnection>;
	elgatoAudioServerProcess: ElgatoAudioServerProcess;
}>;
