import { audioFolderGlyph } from './audio_folder_glyph.ts';
import { backGlyph } from './back_glyph.ts';
import { displayFolderGlyph } from './display_folder_glyph.ts';
import { folderGlyph } from './folder_glyph.ts';
import { IconPalette } from './icon_palette.ts';
import type { PackIcon } from './pack_icon.ts';
import { spotifyFolderGlyph } from './spotify_folder_glyph.ts';

/** The keys a plugin cannot style: the native folders and their Back key. */
export const PackIcons: readonly PackIcon[] = [
	{
		id: 'audio-folder',
		name: 'Audio folder',
		tags: ['folder', 'audio'],
		glyph: audioFolderGlyph,
		color: IconPalette.audio,
		label: 'Audio',
	},
	{
		id: 'spotify-folder',
		name: 'Spotify folder',
		tags: ['folder', 'spotify', 'music'],
		glyph: spotifyFolderGlyph,
		color: IconPalette.spotify,
		label: 'Spotify',
	},
	{
		id: 'display-folder',
		name: 'Display folder',
		tags: ['folder', 'display', 'monitor'],
		glyph: displayFolderGlyph,
		color: IconPalette.display,
		label: 'Display',
	},
	{
		id: 'macros-folder',
		name: 'Macros folder',
		tags: ['folder', 'macros'],
		glyph: (color) => folderGlyph(color),
		color: IconPalette.neutral,
		label: 'Macros',
	},
	{
		id: 'back',
		name: 'Back',
		tags: ['back', 'navigation'],
		glyph: backGlyph,
		color: IconPalette.navigation,
		label: 'Retour',
	},
];
