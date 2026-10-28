/** Opacities the bar of a "Volume" dial uses; the layout only accepts tenths. */
type BarOpacity = 0.4 | 1;

/** What a "Volume" dial shows in the `$B1` layout: device name, volume text and bar. */
export type VolumeDialFeedback = Readonly<{
	title: string;
	value: string;
	indicator: Readonly<{ value: number; opacity: BarOpacity }>;
}>;
