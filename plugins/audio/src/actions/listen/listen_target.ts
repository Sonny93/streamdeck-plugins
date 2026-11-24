/** What a listen action works on, read from its settings. */
export type ListenTarget = Readonly<{
	/** The picked input, `undefined` while none is. */
	sourceId: string | undefined;
	/** The ceiling of the level, 0 to 1 on the `pactl` percent scale (1 is 100 %). */
	maximumLevel: number;
}>;
