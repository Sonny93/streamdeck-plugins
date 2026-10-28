import type { SpotifyUiState } from './spotify_ui_state';

/** Callbacks through which a Spotify window state watch reports back to its owner. `undefined` means Spotify is unreachable. */
export type UiStateWatchCallbacks = Readonly<{
	onChange: (state: SpotifyUiState | undefined) => void;
	onError: (error: unknown) => void;
}>;
