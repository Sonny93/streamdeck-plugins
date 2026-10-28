import { SingletonAction } from '@elgato/streamdeck';
import type { KeyDownEvent, WillAppearEvent } from '@elgato/streamdeck';

import { toggleSpotifyLyrics } from '../spotify/toggle_spotify_lyrics';
import { BringToFrontDefaults } from './key_settings/bring_to_front_defaults';
import type { BringToFrontSettings } from './key_settings/bring_to_front_settings';
import { resolveBringToFront } from './key_settings/resolve_bring_to_front';
import { resolveLyricsKeyState } from './resolve_lyrics_key_state';
import { runSpotifyAction } from './run_spotify_action';
import type { UiStateHub } from './ui_state_hub';
import { UiStateKeys } from './ui_state_keys';

/** Key that shows or hides the lyrics; it is lit while they are open, and greyed (and inert) when the track has none. */
export class ToggleLyricsAction extends SingletonAction<BringToFrontSettings> {
	override readonly manifestId = 'com.sonny93.spotify.toggle-lyrics';

	private readonly keys: UiStateKeys;

	constructor(private readonly hub: UiStateHub) {
		super();
		this.keys = new UiStateKeys({
			hub,
			listActions: () => this.actions.toArray(),
			resolveState: resolveLyricsKeyState,
			label: 'lyrics',
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
		if (this.hub.current?.isLyricsAvailable !== true) {
			return;
		}
		const shouldBringToFront = resolveBringToFront({
			rawSettings: ev.payload.settings,
			defaultValue: BringToFrontDefaults.lyrics,
		});
		await runSpotifyAction(
			ev.action,
			toggleSpotifyLyrics({ shouldBringToFront })
		);
	}
}
