import { resolveStripColumn } from './resolve_strip_column';
import { StripPanel } from './strip_panel';
import type { StripTone } from './strip_tone';
import { StripTones } from './strip_tones';

const GRADIENT_ID = 'strip-background';
const SHAPE_OPACITY = 0.18;

const SHAPES: readonly Readonly<{ x: number; y: number; radius: number }>[] = [
	{ x: 60, y: 118, radius: 70 },
	{ x: 270, y: -14, radius: 58 },
	{ x: 430, y: 116, radius: 78 },
	{ x: 590, y: -10, radius: 52 },
	{ x: 745, y: 112, radius: 66 },
];

/**
 * The slice of the background of the whole touch strip that one dial draws, as an SVG fragment for a 200 by 100 picture.
 * The panel is one 800 by 100 design, a diagonal gradient of the tone with darker circles as a discreet decoration,
 * and each column shows its own 200 px of it, so the four strips line up into a single picture.
 * Everything is vector, since OpenDeck drops pictures embedded in an SVG, and the shapes only darken the gradient.
 */
export function buildStripBackground(tone: StripTone, column = 0): string {
	const { from, to } = StripTones[tone];
	const offset = resolveStripColumn({ column }) * StripPanel.slotWidth;
	const shapes = SHAPES.map(
		(shape) =>
			`<circle cx="${shape.x}" cy="${shape.y}" r="${shape.radius}" fill="#000000" fill-opacity="${SHAPE_OPACITY}"/>`
	).join('');
	return [
		`<defs><linearGradient id="${GRADIENT_ID}" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="${StripPanel.width}" y2="${StripPanel.height}"><stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient></defs>`,
		`<g transform="translate(-${offset} 0)"><rect width="${StripPanel.width}" height="${StripPanel.height}" fill="url(#${GRADIENT_ID})"/>${shapes}</g>`,
	].join('');
}
