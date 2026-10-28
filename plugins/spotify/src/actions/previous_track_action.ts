import type { KeyDownEvent } from '@elgato/streamdeck';
import { action, SingletonAction } from '@elgato/streamdeck';

import { skipSpotifyToPrevious } from '../spotify/skip_spotify_to_previous';
import { runSpotifyAction } from './run_spotify_action';

@action({ UUID: 'com.sonny93.spotify.previous-track' })
export class PreviousTrackAction extends SingletonAction {
	override async onKeyDown(ev: KeyDownEvent): Promise<void> {
		await runSpotifyAction(ev.action, skipSpotifyToPrevious);
	}
}
