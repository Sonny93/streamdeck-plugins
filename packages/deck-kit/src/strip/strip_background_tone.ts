/** The colors of a strip background: the two stops of its diagonal gradient, and the color of the decorative circles drawn over it. */
export type StripBackgroundTone = Readonly<{
	from: string;
	to: string;
	decoration: string;
}>;
