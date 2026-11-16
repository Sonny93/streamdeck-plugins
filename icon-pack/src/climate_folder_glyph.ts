import { folderGlyph } from './folder_glyph.ts';

/** A folder with a small snowflake inside, in the style of the Climate Deck keys, drawn in a 24×24 box. */
export function climateFolderGlyph(color: string): string {
	return folderGlyph(
		color,
		`<path d="M12 10.8v6.8M9.06 12.5l5.88 3.4M9.06 15.9l5.88-3.4" stroke-width="1.4"/>`
	);
}
