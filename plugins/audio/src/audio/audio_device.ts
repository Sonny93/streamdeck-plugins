import type { AudioFlow } from './audio_flow';

/** An active audio device of Windows, as the sound settings list it. */
export type AudioDevice = Readonly<{
	/** Endpoint id, stable across reboots: `{0.0.0.00000000}.{guid}`. */
	id: string;
	name: string;
	flow: AudioFlow;
}>;
