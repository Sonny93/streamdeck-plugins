import type { KeyDownEvent } from '@elgato/streamdeck';
import { action, SingletonAction } from '@elgato/streamdeck';

import { runSpotifyAction } from './run_spotify_action';
import { openSpotifySearch } from '../spotify/open_spotify_search';

@action({ UUID: 'com.sonny93.spotify.open-search' })
export class OpenSearchAction extends SingletonAction {
	override async onKeyDown(ev: KeyDownEvent): Promise<void> {
		await runSpotifyAction(ev.action, openSpotifySearch);
	}
}
