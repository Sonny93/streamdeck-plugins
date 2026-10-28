/** The cover of the playing track drawn behind a dial's own content, and the dial's column, so that the dials share one picture across the strip. */
export type DialBackdrop = Readonly<{
	coverDataUrl: string;
	column: number;
}>;
