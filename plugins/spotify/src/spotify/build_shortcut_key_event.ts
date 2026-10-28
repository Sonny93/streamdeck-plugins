import type { SpotifyShortcut } from './spotify_shortcut';

/** Builds the params of an `Input.dispatchKeyEvent` command for one phase of a shortcut. */
export function buildShortcutKeyEvent(
	shortcut: SpotifyShortcut,
	type: 'rawKeyDown' | 'keyUp'
): Readonly<Record<string, unknown>> {
	return {
		type,
		modifiers: shortcut.modifiers,
		key: shortcut.key,
		code: shortcut.code,
		windowsVirtualKeyCode: shortcut.windowsVirtualKeyCode,
		nativeVirtualKeyCode: shortcut.windowsVirtualKeyCode,
	};
}
