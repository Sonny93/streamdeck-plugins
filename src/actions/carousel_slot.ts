/** One cover of the carousel: its distance to the centered position (negative on the left) and its cover, if loaded. */
export type CarouselSlot = Readonly<{
	offset: number;
	coverDataUrl: string | undefined;
}>;
