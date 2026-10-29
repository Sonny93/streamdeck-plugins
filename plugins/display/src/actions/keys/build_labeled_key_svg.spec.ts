import { describe, expect, it } from 'vitest';

import { buildLabeledKeySvg } from './build_labeled_key_svg';
import { sunGlyph } from './sun_glyph';

const SKY_BLUE = '#4FC3F7';

describe('buildLabeledKeySvg', () => {
	it('draws the icon and the label in the color of the key', () => {
		const svg = buildLabeledKeySvg({
			glyph: sunGlyph,
			color: SKY_BLUE,
			label: { text: 'Bureau', position: 'top' },
		});

		expect(svg).toContain(`stroke="${SKY_BLUE}"`);
		expect(svg).toMatch(/<text[^>]*fill="#4FC3F7"[^>]*>Bureau<\/text>/);
	});

	it('puts the label above or below the icon', () => {
		const baselineOf = (position: 'top' | 'bottom'): number =>
			Number(
				/<text[^>]* y="(\d+)"/.exec(
					buildLabeledKeySvg({
						glyph: sunGlyph,
						color: SKY_BLUE,
						label: { text: 'Gauche', position },
					})
				)?.[1]
			);

		expect(baselineOf('top')).toBeLessThan(72);
		expect(baselineOf('bottom')).toBeGreaterThan(72);
	});

	it('escapes the label', () => {
		expect(
			buildLabeledKeySvg({
				glyph: sunGlyph,
				color: SKY_BLUE,
				label: { text: 'TV & <PC>', position: 'top' },
			})
		).toContain('>TV &amp; &lt;PC&gt;</text>');
	});

	it('shortens a label too long for the key', () => {
		expect(
			buildLabeledKeySvg({
				glyph: sunGlyph,
				color: SKY_BLUE,
				label: { text: 'Écran du bureau, en haut à gauche', position: 'top' },
			})
		).toMatch(/>[^<]+…<\/text>/);
	});
});
