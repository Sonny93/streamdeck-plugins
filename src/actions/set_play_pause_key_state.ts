import type { WillAppearEvent } from '@elgato/streamdeck';

import { PlayPauseKeyState } from './play_pause_key_state';
import type { SpotifyPlayerState } from '../spotify/spotify_player_state';

/** Shows the pause icon on a "Play / Pause" key while Spotify is playing, and the play icon otherwise. */
export async function setPlayPauseKeyState(
	action: WillAppearEvent['action'],
	state: SpotifyPlayerState | undefined
): Promise<void> {
	if (!action.isKey()) {
		return;
	}
	await action.setState(
		state?.isPaused === false ? PlayPauseKeyState.pause : PlayPauseKeyState.play
	);
}
