import { SingletonAction } from '@elgato/streamdeck';
import type {
	KeyDownEvent,
	PropertyInspectorDidAppearEvent,
	WillAppearEvent,
	WillDisappearEvent,
} from '@elgato/streamdeck';
import type { LanguageStore } from 'deck-kit/i18n/language_store';

import { toggleSpotifyFullscreen } from '../spotify/toggle_spotify_fullscreen';
import { BringToFrontDefaults } from './key_settings/bring_to_front_defaults';
import type { BringToFrontSettings } from './key_settings/bring_to_front_settings';
import { resolveBringToFront } from './key_settings/resolve_bring_to_front';
import { LanguageInspectorChannel } from './language/language_inspector_channel';
import { resolveToggleKeyState } from './resolve_toggle_key_state';
import { runSpotifyAction } from './run_spotify_action';
import type { UiStateHub } from './ui_state_hub';
import { UiStateKeys } from './ui_state_keys';

type BringToFrontSendToPluginEvent = Parameters<
	NonNullable<SingletonAction<BringToFrontSettings>['onSendToPlugin']>
>[0];

/** Key that enters or leaves the Spotify full screen mode; it is lit while Spotify is in full screen. */
export class ToggleFullscreenAction extends SingletonAction<BringToFrontSettings> {
	override readonly manifestId = 'com.sonny93.spotify.toggle-fullscreen';

	private readonly keys: UiStateKeys;
	private readonly inspector: LanguageInspectorChannel;

	constructor(hub: UiStateHub, languageStore: LanguageStore) {
		super();
		this.inspector = new LanguageInspectorChannel(languageStore);
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
