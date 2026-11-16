import { SingletonAction } from '@elgato/streamdeck';
import type {
	KeyDownEvent,
	PropertyInspectorDidAppearEvent,
	WillAppearEvent,
	WillDisappearEvent,
} from '@elgato/streamdeck';
import type { LanguageStore } from 'deck-kit/i18n/language_store';

import { toggleSpotifyLyrics } from '../spotify/toggle_spotify_lyrics';
import { BringToFrontDefaults } from './key_settings/bring_to_front_defaults';
import type { BringToFrontSettings } from './key_settings/bring_to_front_settings';
import { resolveBringToFront } from './key_settings/resolve_bring_to_front';
import { LanguageInspectorChannel } from './language/language_inspector_channel';
import { resolveLyricsKeyState } from './resolve_lyrics_key_state';
import { runSpotifyAction } from './run_spotify_action';
import type { UiStateHub } from './ui_state_hub';
import { UiStateKeys } from './ui_state_keys';

type BringToFrontSendToPluginEvent = Parameters<
	NonNullable<SingletonAction<BringToFrontSettings>['onSendToPlugin']>
>[0];

/** Key that shows or hides the lyrics; it is lit while they are open, and greyed (and inert) when the track has none. */
export class ToggleLyricsAction extends SingletonAction<BringToFrontSettings> {
	override readonly manifestId = 'com.sonny93.spotify.toggle-lyrics';

	private readonly keys: UiStateKeys;
	private readonly inspector: LanguageInspectorChannel;

	constructor(
		private readonly hub: UiStateHub,
		languageStore: LanguageStore
	) {
		super();
		this.inspector = new LanguageInspectorChannel(languageStore);
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

	override onWillDisappear(ev: WillDisappearEvent<BringToFrontSettings>): void {
		this.inspector.forget(ev.action.id);
		this.keys.disappear(this.actions.some(() => true));
	}

	override async onSendToPlugin(
		ev: BringToFrontSendToPluginEvent
	): Promise<void> {
		await this.inspector.handle(ev.action.id, ev.payload);
	}

	override async onPropertyInspectorDidAppear(
		ev: PropertyInspectorDidAppearEvent<BringToFrontSettings>
	): Promise<void> {
		await this.inspector.deliverTo(ev.action.id);
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
