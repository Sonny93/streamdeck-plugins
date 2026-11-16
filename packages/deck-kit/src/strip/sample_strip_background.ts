import type { StripBackgroundTone } from './strip_background_tone';
import { StripPanel } from './strip_panel';

const CHANNEL_COUNT = 3;

function readChannel(color: string, index: number): number {
	return Number.parseInt(color.slice(1 + index * 2, 3 + index * 2), 16);
}

/** The color of the gradient of a tone at a point of the whole 800 by 100 panel, as `#RRGGBB`. The decorative circles are left out. */
export function sampleStripBackground(
	tone: StripBackgroundTone,
	point: Readonly<{ x: number; y: number }>
): string {
	const { from, to } = tone;
	const lengthSquared = StripPanel.width ** 2 + StripPanel.height ** 2;
	const progress = Math.min(
		Math.max(
			(point.x * StripPanel.width + point.y * StripPanel.height) /
				lengthSquared,
			0
		),
		1
	);
	const channels = Array.from({ length: CHANNEL_COUNT }, (_unused, index) => {
		const start = readChannel(from, index);
		return Math.round(start + (readChannel(to, index) - start) * progress);
	});
	return `#${channels.map((channel) => channel.toString(16).padStart(2, '0')).join('')}`;
}
