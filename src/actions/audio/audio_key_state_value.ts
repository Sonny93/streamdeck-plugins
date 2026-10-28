import type { AudioKeyState } from './audio_key_state';

/** One of the manifest state indexes of the audio device keys. */
export type AudioKeyStateValue =
	(typeof AudioKeyState)[keyof typeof AudioKeyState];
