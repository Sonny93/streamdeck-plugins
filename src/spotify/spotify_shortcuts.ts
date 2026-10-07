import type { SpotifyShortcut } from './spotify_shortcut';

const CONTROL_MODIFIER_BIT = 2;
const KEY_K_VIRTUAL_KEY_CODE = 75;

/** Keyboard shortcuts handled by the Spotify web UI. */
export const SpotifyShortcuts = {
	openSearch: {
		key: 'k',
		code: 'KeyK',
		windowsVirtualKeyCode: KEY_K_VIRTUAL_KEY_CODE,
		modifiers: CONTROL_MODIFIER_BIT,
	},
} as const satisfies Record<string, SpotifyShortcut>;
