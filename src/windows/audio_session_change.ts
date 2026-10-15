/** Volume changes to apply to audio sessions; a missing field is left as it is. */
export type AudioSessionChange = Readonly<{
	volume?: number;
	isMuted?: boolean;
}>;
