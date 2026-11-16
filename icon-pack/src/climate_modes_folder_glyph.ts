import { folderGlyph } from './folder_glyph.ts';

/** A folder with a small sun inside, for the mode presets of the Climate Deck keys, drawn in a 24×24 box. */
export function climateModesFolderGlyph(color: string): string {
	return folderGlyph(
		color,
		`<circle cx="12" cy="14.2" r="1.7" stroke-width="1.4"/><path d="M12 10.4v1.2M12 16.8v1.2M8.2 14.2h1.2M14.6 14.2h1.2M9.3 11.5l.85.85M13.85 16.05l.85.85M9.3 16.9l.85-.85M13.85 12.35l.85-.85" stroke-width="1.4"/>`
	);
}
