import type { KeyDownEvent } from '@elgato/streamdeck';
import { action, SingletonAction } from '@elgato/streamdeck';

import { runSpotifyAction } from './run_spotify_action';
import { resolveBringToFront } from './key_settings/resolve_bring_to_front';
import { BringToFrontDefaults } from './key_settings/bring_to_front_defaults';
import { toggleSpotifyFullscreen } from '../spotify/toggle_spotify_fullscreen';
import type { BringToFrontSettings } from './key_settings/bring_to_front_settings';

@action({ UUID: 'com.sonny93.spotify.toggle-fullscreen' })
export class ToggleFullscreenAction extends SingletonAction<BringToFrontSettings> {
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
