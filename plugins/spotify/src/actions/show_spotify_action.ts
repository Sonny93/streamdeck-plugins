import { action, SingletonAction } from '@elgato/streamdeck';
import type { KeyDownEvent, WillAppearEvent } from '@elgato/streamdeck';

import { bringSpotifyToFront } from '../spotify/bring_spotify_to_front';
import { resolveToggleKeyState } from './resolve_toggle_key_state';
import { runSpotifyAction } from './run_spotify_action';
import type { UiStateHub } from './ui_state_hub';
import { UiStateKeys } from './ui_state_keys';

/**
 * Key that brings the Spotify window to the foreground (launching Spotify when it is closed); pressing it again keeps it there.
 * It is lit while the Spotify window has the focus.
 */
@action({ UUID: 'com.sonny93.spotify.show-spotify' })
export class ShowSpotifyAction extends SingletonAction {
	private readonly keys: UiStateKeys;

	constructor(hub: UiStateHub) {
		super();
		this.keys = new UiStateKeys({
			hub,
			listActions: () => this.actions.toArray(),
			resolveState: (state) => resolveToggleKeyState(state?.isFocused),
			label: 'show Spotify',
		});
	}

	override async onWillAppear(ev: WillAppearEvent): Promise<void> {
		await this.keys.appear(ev.action);
	}

	override onWillDisappear(): void {
		this.keys.disappear(this.actions.some(() => true));
	}

	override async onKeyDown(ev: KeyDownEvent): Promise<void> {
		await runSpotifyAction(ev.action, bringSpotifyToFront);
	}
}
