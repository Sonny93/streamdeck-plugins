/** How a drawn key looks in one of its states: its icon, and the color of the icon and of the label. */
export type KeyAppearance = Readonly<{
	glyph: (color: string) => string;
	color: string;
}>;
