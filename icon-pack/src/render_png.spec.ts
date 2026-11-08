import { describe, expect, it } from 'vitest';

import { audioFolderGlyph } from './audio_folder_glyph.ts';
import { buildKeySvg } from './build_key_svg.ts';
import { renderPng } from './render_png.ts';

const AMBER = '#FFB020';
const KEY_WIDTH = 144;

function renderAudioFolderKey(withLabel: boolean): Buffer {
	const svg = buildKeySvg({
		glyph: audioFolderGlyph,
		color: AMBER,
		label: withLabel ? { text: 'Audio', position: 'top' } : undefined,
	});
	return renderPng({ svg, width: KEY_WIDTH });
}

describe('renderPng', () => {
	it('should draw the label text when rendering a labeled key', () => {
		const labeled = renderAudioFolderKey(true);
		const unlabeledGlyphOnly = buildKeySvg({
			glyph: audioFolderGlyph,
			color: AMBER,
			label: { text: 'Audio', position: 'top' },
		}).replace(/<text.*<\/text>/, '');

		expect(
			labeled.equals(renderPng({ svg: unlabeledGlyphOnly, width: KEY_WIDTH }))
		).toBe(false);
	});
});
