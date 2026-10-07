import type { KeyDownEvent } from '@elgato/streamdeck';
import { action, SingletonAction } from '@elgato/streamdeck';

import { runSpotifyAction } from './run_spotify_action';
import { toggleSpotifyPlayback } from '../spotify/toggle_spotify_playback';

@action({ UUID: 'com.sonny93.spotify.play-pause' })
export class PlayPauseAction extends SingletonAction {
	override async onKeyDown(ev: KeyDownEvent): Promise<void> {
		await runSpotifyAction(ev.action, toggleSpotifyPlayback);
	}
}
