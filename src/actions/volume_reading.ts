/**
 * What a "Volume" dial shows: what it controls (`caption`), the app name, and its volume (0 to 1) and mute state.
 * `volume` is `undefined` when the app plays no sound right now (or none is picked), so there is nothing to change.
 */
export type VolumeReading = Readonly<{
	caption: string;
	name: string;
	volume: number | undefined;
	isMuted: boolean;
}>;
