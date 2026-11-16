import type { AudioApp } from './audio_app';
import type { AudioSessionChange } from './audio_session_change';
import type { ForegroundApp } from './foreground_app';
import type { ForegroundReadOptions } from './foreground_read_options';

/** What the volume dials need from the OS mixer: the apps playing sound, a way to change one of them, and the app in the foreground. */
export type AudioMixer = Readonly<{
	listApps: () => Promise<AudioApp[]>;
	updateApp: (
		imageName: string,
		change: AudioSessionChange
	) => Promise<boolean>;
	readForegroundApp: (
		options?: ForegroundReadOptions
	) => Promise<ForegroundApp | undefined>;
}>;
