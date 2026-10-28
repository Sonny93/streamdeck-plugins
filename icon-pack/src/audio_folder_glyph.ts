import { folderGlyph } from './folder_glyph.ts';

/** A folder with a small speaker inside, in the style of the Audio Deck keys, drawn in a 24×24 box. */
export function audioFolderGlyph(color: string): string {
	return folderGlyph(
		color,
		`<path d="M8.4 12.6h1.6l2.3-2v6.3l-2.3-2H8.4z" fill="${color}" stroke-width="1.4"/><path d="M14.4 11.9a2.6 2.6 0 0 1 0 3.7" stroke-width="1.6"/>`
	);
}
