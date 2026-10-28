import type { KeyDownEvent } from '@elgato/streamdeck';
import { SingletonAction } from '@elgato/streamdeck';

import { skipSpotifyToNext } from '../spotify/skip_spotify_to_next';
import { runSpotifyAction } from './run_spotify_action';

export class NextTrackAction extends SingletonAction {
	override readonly manifestId = 'com.sonny93.spotify.next-track';

	override async onKeyDown(ev: KeyDownEvent): Promise<void> {
		await runSpotifyAction(ev.action, skipSpotifyToNext);
	}
}
