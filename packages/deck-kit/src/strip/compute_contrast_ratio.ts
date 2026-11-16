const CHANNEL_COUNT = 3;
const LINEAR_THRESHOLD = 0.04045;
const LUMINANCE_WEIGHTS = [0.2126, 0.7152, 0.0722] as const;
const CONTRAST_OFFSET = 0.05;

function readChannels(color: string): readonly number[] {
	return Array.from({ length: CHANNEL_COUNT }, (_unused, index) =>
		Number.parseInt(color.slice(1 + index * 2, 3 + index * 2), 16)
	);
}

function toLinear(channel: number): number {
	const unit = channel / 255;
	return unit <= LINEAR_THRESHOLD
		? unit / 12.92
		: ((unit + 0.055) / 1.055) ** 2.4;
}

/** The relative luminance of a `#RRGGBB` color, as WCAG defines it. */
export function computeLuminance(color: string): number {
	return readChannels(color).reduce(
		(total, channel, index) =>
			total + toLinear(channel) * (LUMINANCE_WEIGHTS[index] ?? 0),
		0
	);
}

/** The WCAG contrast ratio between two `#RRGGBB` colors, from 1 to 21. */
export function computeContrastRatio(first: string, second: string): number {
	const luminances = [computeLuminance(first), computeLuminance(second)];
	return (
		(Math.max(...luminances) + CONTRAST_OFFSET) /
		(Math.min(...luminances) + CONTRAST_OFFSET)
	);
}
