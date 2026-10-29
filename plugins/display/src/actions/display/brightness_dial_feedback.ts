/** Opacities the bar of a "Brightness" dial uses; the layout only accepts tenths. */
type BarOpacity = 0.4 | 1;

/** What a "Brightness" dial shows in the `$B1` layout: monitor name, brightness text and bar. */
export type BrightnessDialFeedback = Readonly<{
	title: string;
	value: string;
	indicator: Readonly<{ value: number; opacity: BarOpacity }>;
}>;
