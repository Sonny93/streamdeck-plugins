/** One image of the pack: an icon with its label above, below, or without label. */
export type IconVariant = Readonly<{
	fileName: string;
	name: string;
	tags: readonly string[];
	svg: string;
}>;
