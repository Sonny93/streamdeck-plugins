/** A playback stream of PipeWire/PulseAudio, reduced to what the volume dials use; `volume` is 0 to 1. */
export type SinkInput = Readonly<{
	index: number;
	imageName: string;
	displayName: string;
	volume: number;
	isMuted: boolean;
	processId: number | undefined;
}>;
