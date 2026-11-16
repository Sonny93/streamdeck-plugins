import type { AudioFlow } from './audio_flow';

/** An active audio device, as the sound settings of the system list it. */
export type AudioDevice = Readonly<{
	/** Stable across reboots: the endpoint id on Windows (`{0.0.0.00000000}.{guid}`), the PipeWire node name on Linux. */
	id: string;
	name: string;
	flow: AudioFlow;
}>;
