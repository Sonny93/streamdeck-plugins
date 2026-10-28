/** A keyboard shortcut to dispatch to the Spotify page through `Input.dispatchKeyEvent`. */
export type SpotifyShortcut = Readonly<{
	key: string;
	code: string;
	windowsVirtualKeyCode: number;
	modifiers: number;
}>;
