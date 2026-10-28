/** An icon of the pack, before it is split into its label variants. */
export type PackIcon = Readonly<{
	id: string;
	name: string;
	tags: readonly string[];
	glyph: (color: string) => string;
	color: string;
	label: string;
}>;
