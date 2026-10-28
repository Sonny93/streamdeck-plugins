import { folderGlyph } from './folder_glyph.ts';

/** A folder with the play triangle of the Spotify Deck keys inside, drawn in a 24×24 box. */
export function spotifyFolderGlyph(color: string): string {
	return folderGlyph(
		color,
		`<path d="M10.2 10.6v5.8l4.8-2.9z" fill="${color}" stroke-width="1.4"/>`
	);
}
