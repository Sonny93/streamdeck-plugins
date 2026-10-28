import type { KeyDownEvent } from '@elgato/streamdeck';
import { SingletonAction } from '@elgato/streamdeck';

import { skipSpotifyToPrevious } from '../spotify/skip_spotify_to_previous';
import { runSpotifyAction } from './run_spotify_action';

export class PreviousTrackAction extends SingletonAction {
	override readonly manifestId = 'com.sonny93.spotify.previous-track';

	override async onKeyDown(ev: KeyDownEvent): Promise<void> {
		await runSpotifyAction(ev.action, skipSpotifyToPrevious);
	}
}
