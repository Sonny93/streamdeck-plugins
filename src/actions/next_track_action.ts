import type { KeyDownEvent } from '@elgato/streamdeck';
import { action, SingletonAction } from '@elgato/streamdeck';

import { runSpotifyAction } from './run_spotify_action';
import { skipSpotifyToNext } from '../spotify/skip_spotify_to_next';

@action({ UUID: 'com.sonny93.spotify.next-track' })
export class NextTrackAction extends SingletonAction {
	override async onKeyDown(ev: KeyDownEvent): Promise<void> {
		await runSpotifyAction(ev.action, skipSpotifyToNext);
	}
}
