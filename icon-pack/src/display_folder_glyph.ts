import { folderGlyph } from './folder_glyph.ts';

/** A folder with a small monitor inside, in the style of the Display Deck keys, drawn in a 24×24 box. */
export function displayFolderGlyph(color: string): string {
	return folderGlyph(
		color,
		`<rect x="8" y="10" width="8" height="5" rx="1" stroke-width="1.4"/><path d="M12 15v1.8M10 16.8h4" stroke-width="1.4"/>`
	);
}
