import { LyricsKeyState } from './lyrics_key_state';
import type { SpotifyUiState } from '../spotify/spotify_ui_state';

/** Picks the image of a "Toggle lyrics" key: lit while the lyrics are open, plain while closed, greyed when the track has none or Spotify is unreachable. */
export function resolveLyricsKeyState(
	state: SpotifyUiState | undefined
): number {
	if (state?.isLyricsAvailable !== true) {
		return LyricsKeyState.unavailable;
	}
	return state.isLyricsOpen ? LyricsKeyState.open : LyricsKeyState.closed;
}
