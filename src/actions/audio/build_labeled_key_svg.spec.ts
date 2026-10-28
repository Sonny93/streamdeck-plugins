import { describe, expect, it } from 'vitest';

import { speakerGlyph } from './speaker_glyph';
import { buildLabeledKeySvg } from './build_labeled_key_svg';

const AMBER = '#FFB020';

describe('buildLabeledKeySvg', () => {
	it('draws the icon and the label in the color of the key', () => {
		const svg = buildLabeledKeySvg({
			glyph: speakerGlyph,
			color: AMBER,
			label: { text: 'Casque', position: 'top' },
		});

		expect(svg).toContain(`stroke="${AMBER}"`);
		expect(svg).toMatch(/<text[^>]*fill="#FFB020"[^>]*>Casque<\/text>/);
	});

	it('puts the label above or below the icon', () => {
		const baselineOf = (position: 'top' | 'bottom'): number =>
			Number(
				/<text[^>]* y="(\d+)"/.exec(
					buildLabeledKeySvg({
						glyph: speakerGlyph,
						color: AMBER,
						label: { text: 'Enceintes', position },
					})
				)?.[1]
			);

		expect(baselineOf('top')).toBeLessThan(72);
		expect(baselineOf('bottom')).toBeGreaterThan(72);
	});

	it('escapes the label', () => {
		expect(
			buildLabeledKeySvg({
				glyph: speakerGlyph,
				color: AMBER,
				label: { text: 'PC & <TV>', position: 'top' },
			})
		).toContain('>PC &amp; &lt;TV&gt;</text>');
	});

	it('shortens a label too long for the key', () => {
		expect(
			buildLabeledKeySvg({
				glyph: speakerGlyph,
				color: AMBER,
				label: { text: 'Haut-parleurs du bureau, à gauche', position: 'top' },
			})
		).toMatch(/>[^<]+…<\/text>/);
	});
});
