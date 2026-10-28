import type { AudioSessionChange } from './audio_session_change';
import type { AudioSessionSnapshot } from './audio_session_snapshot';

/** The subset of Windows Core Audio needed to list the audio sessions of every active output device and change their volume. */
export type CoreAudio = Readonly<{
	listSessions: () => AudioSessionSnapshot[];
	updateSessions: (
		select: (session: AudioSessionSnapshot) => boolean,
		change: AudioSessionChange
	) => number;
	readProcessImagePath: (processId: number) => string | undefined;
}>;
