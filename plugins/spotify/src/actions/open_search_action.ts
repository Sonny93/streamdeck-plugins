import { SingletonAction } from '@elgato/streamdeck';
import type { KeyDownEvent, WillAppearEvent } from '@elgato/streamdeck';

import { openSpotifySearch } from '../spotify/open_spotify_search';
import { resolveToggleKeyState } from './resolve_toggle_key_state';
import { runSpotifyAction } from './run_spotify_action';
import type { UiStateHub } from './ui_state_hub';
import { UiStateKeys } from './ui_state_keys';

/** Key that brings Spotify to front with the search focused; it is lit while the search is open. */
export class OpenSearchAction extends SingletonAction {
	override readonly manifestId = 'com.sonny93.spotify.open-search';

	private readonly keys: UiStateKeys;

	constructor(hub: UiStateHub) {
		super();
		this.keys = new UiStateKeys({
			hub,
			listActions: () => this.actions.toArray(),
			resolveState: (state) => resolveToggleKeyState(state?.isSearchOpen),
			label: 'search',
		});
	}

	override async onWillAppear(ev: WillAppearEvent): Promise<void> {
		await this.keys.appear(ev.action);
	}

	override onWillDisappear(): void {
		this.keys.disappear(this.actions.some(() => true));
	}

	override async onKeyDown(ev: KeyDownEvent): Promise<void> {
		await runSpotifyAction(ev.action, openSpotifySearch);
	}
}
