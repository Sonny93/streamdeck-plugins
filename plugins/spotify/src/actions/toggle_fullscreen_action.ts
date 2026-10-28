import { action, SingletonAction } from '@elgato/streamdeck';
import type { KeyDownEvent, WillAppearEvent } from '@elgato/streamdeck';

import { UiStateKeys } from './ui_state_keys';
import type { UiStateHub } from './ui_state_hub';
import { runSpotifyAction } from './run_spotify_action';
import { resolveToggleKeyState } from './resolve_toggle_key_state';
import { resolveBringToFront } from './key_settings/resolve_bring_to_front';
import { BringToFrontDefaults } from './key_settings/bring_to_front_defaults';
import { toggleSpotifyFullscreen } from '../spotify/toggle_spotify_fullscreen';
import type { BringToFrontSettings } from './key_settings/bring_to_front_settings';

/** Key that enters or leaves the Spotify full screen mode; it is lit while Spotify is in full screen. */
@action({ UUID: 'com.sonny93.spotify.toggle-fullscreen' })
export class ToggleFullscreenAction extends SingletonAction<BringToFrontSettings> {
	private readonly keys: UiStateKeys;

	constructor(hub: UiStateHub) {
		super();
		this.keys = new UiStateKeys({
			hub,
			listActions: () => this.actions.toArray(),
			resolveState: (state) => resolveToggleKeyState(state?.isFullscreen),
			label: 'full screen',
		});
	}

	override async onWillAppear(
		ev: WillAppearEvent<BringToFrontSettings>
	): Promise<void> {
		await this.keys.appear(ev.action);
	}

	override onWillDisappear(): void {
		this.keys.disappear(this.actions.some(() => true));
	}

	override async onKeyDown(
		ev: KeyDownEvent<BringToFrontSettings>
	): Promise<void> {
		const shouldBringToFront = resolveBringToFront({
			rawSettings: ev.payload.settings,
			defaultValue: BringToFrontDefaults.fullscreen,
		});
		await runSpotifyAction(
			ev.action,
			toggleSpotifyFullscreen({ shouldBringToFront })
		);
	}
}
