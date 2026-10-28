import type { SpotifyPlayerState } from './spotify_player_state';

/** Callbacks through which a player state watch reports back to its owner. `undefined` means Spotify is unreachable. */
export type PlayerStateWatchCallbacks = Readonly<{
	onChange: (state: SpotifyPlayerState | undefined) => void;
	onError: (error: unknown) => void;
}>;
