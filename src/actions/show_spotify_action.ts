import type { KeyDownEvent } from '@elgato/streamdeck';
import { action, SingletonAction } from '@elgato/streamdeck';

import { runSpotifyAction } from './run_spotify_action';
import { bringSpotifyToFront } from '../spotify/bring_spotify_to_front';

/** Key that brings the Spotify window to the foreground (launching Spotify when it is closed); pressing it again keeps it there. */
@action({ UUID: 'com.sonny93.spotify.show-spotify' })
export class ShowSpotifyAction extends SingletonAction {
	override async onKeyDown(ev: KeyDownEvent): Promise<void> {
		await runSpotifyAction(ev.action, bringSpotifyToFront);
	}
}
