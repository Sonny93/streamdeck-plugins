import { describe, expect, it } from 'vitest';

import { audioFolderGlyph } from './audio_folder_glyph.ts';
import { buildKeySvg } from './build_key_svg.ts';
import type { KeyLabel } from './key_label.ts';

const AMBER = '#FFB020';

function buildAudioFolderKey(label: KeyLabel | undefined): string {
	return buildKeySvg({ glyph: audioFolderGlyph, color: AMBER, label });
}

describe('buildKeySvg', () => {
	it('draws the icon and the label in the same color', () => {
		const svg = buildAudioFolderKey({ text: 'Audio', position: 'top' });

		expect(svg).toContain(`stroke="${AMBER}"`);
		expect(svg).toMatch(/<text[^>]*fill="#FFB020"[^>]*>Audio<\/text>/);
	});

	it('puts the label above or below the icon', () => {
		const baselineOf = (position: KeyLabel['position']): number =>
			Number(
				/<text[^>]* y="(\d+)"/.exec(
					buildAudioFolderKey({ text: 'Audio', position })
				)?.[1]
			);

		expect(baselineOf('top')).toBeLessThan(72);
		expect(baselineOf('bottom')).toBeGreaterThan(72);
	});

	it('gives the whole key to the icon without label', () => {
		const svg = buildAudioFolderKey(undefined);

		expect(svg).not.toContain('<text');
		expect(svg).toContain('translate(24 24) scale(4)');
	});
});
