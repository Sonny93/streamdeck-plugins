import type {
	DidReceiveSettingsEvent,
	KeyDownEvent,
	WillAppearEvent,
	WillDisappearEvent,
} from '@elgato/streamdeck';
import type { Language } from 'deck-kit/i18n/language';
import type { KeyAppearance } from 'deck-kit/keys/key_appearance';

import { audioMessages } from '../../i18n/audio_messages';
import type { ListenView } from '../../listen/listen_view';
import { headphonesGlyph } from '../keys/headphones_glyph';
import { KeyPalette } from '../keys/key_palette';
import { KeyState } from '../keys/key_state';
import type { KeyStateValue } from '../keys/key_state_value';
import { LocalizedKeyImages } from '../keys/localized_key_images';
import { mutedHeadphonesGlyph } from '../keys/muted_headphones_glyph';
import { ListenAction } from './listen_action';
import type { ListenActionSettings } from './listen_action_settings';
import type { ListenTarget } from './listen_target';
import { resolveListenKeyState } from './resolve_listen_key_state';

const APPEARANCES: Readonly<Record<KeyStateValue, KeyAppearance>> = {
	[KeyState.off]: { glyph: mutedHeadphonesGlyph, color: KeyPalette.idle },
	[KeyState.on]: { glyph: headphonesGlyph, color: KeyPalette.active },
	[KeyState.unavailable]: {
		glyph: headphonesGlyph,
		color: KeyPalette.unavailable,
	},
};

/**
 * Key that starts or stops playing its input in the default output, at the level remembered for that input, never above the maximum level of its settings.
 * The headphones are amber while listening and grey, struck through, while not.
 */
export class ListenKeyAction extends ListenAction {
	override readonly manifestId = 'com.sonny93.audio.listen-toggle';

	private readonly images = new LocalizedKeyImages((language) =>
		audioMessages.text('listenKeyLabel', language)
	);

	override async onWillAppear(
		ev: WillAppearEvent<ListenActionSettings>
	): Promise<void> {
		this.images.keep(
			ev.action.id,
			ev.payload.settings,
			this.languageStore.current
		);
		await super.onWillAppear(ev);
	}

	override async onDidReceiveSettings(
		ev: DidReceiveSettingsEvent<ListenActionSettings>
	): Promise<void> {
		this.images.keep(
			ev.action.id,
			ev.payload.settings,
			this.languageStore.current
		);
		await super.onDidReceiveSettings(ev);
	}

	override onWillDisappear(ev: WillDisappearEvent<ListenActionSettings>): void {
		this.images.forget(ev.action.id);
		super.onWillDisappear(ev);
	}

	override async onKeyDown(
		ev: KeyDownEvent<ListenActionSettings>
	): Promise<void> {
		await this.runChange(ev.action, (hub, target) =>
			hub.toggle(target.sourceId, target.maximumLevel)
		);
	}

	protected override onLanguageChange(): void {
		this.images.relabel(this.languageStore.current);
	}

	protected override async render(
		keyAction: WillAppearEvent<ListenActionSettings>['action'],
		target: ListenTarget,
		view: ListenView | undefined,
		_language: Language
	): Promise<void> {
		if (!keyAction.isKey()) {
			return;
		}
		const state = resolveListenKeyState(view, target.sourceId);
		await keyAction.setState(state);
		await this.images.draw(keyAction, APPEARANCES[state]);
	}
}
