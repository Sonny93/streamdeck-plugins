import type { Scheduler } from 'deck-kit/async/scheduler';

import type { ElgatoAudioServerProcess } from './elgato_audio_server_process';

export type ElgatoAudioRestarterOptions = Readonly<{
	serverProcess: ElgatoAudioServerProcess;
	schedule: Scheduler;
	pollIntervalMilliseconds: number;
	restartTimeoutMilliseconds: number;
}>;
