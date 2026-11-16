import { streamDeck, SingletonAction } from '@elgato/streamdeck';
import type {
	DidReceiveSettingsEvent,
	KeyDownEvent,
	PropertyInspectorDidAppearEvent,
	WillAppearEvent,
	WillDisappearEvent,
} from '@elgato/streamdeck';
import type { LanguageStore } from 'deck-kit/i18n/language_store';
import type { KeyAppearance } from 'deck-kit/keys/key_appearance';
import type { KeyLabelSettings } from 'deck-kit/keys/key_label_settings';

import type { ElgatoAudioRestarter } from '../../elgato/elgato_audio_restarter';
import { audioMessages } from '../../i18n/audio_messages';
import { KeyPalette } from '../keys/key_palette';
import { LocalizedKeyImages } from '../keys/localized_key_images';
import { restartGlyph } from '../keys/restart_glyph';
import { LanguageInspectorChannel } from '../language/language_inspector_channel';

const APPEARANCE: KeyAppearance = {
	glyph: restartGlyph,
	color: KeyPalette.active,
};
const UNAVAILABLE_APPEARANCE: KeyAppearance = {
	glyph: restartGlyph,
	color: KeyPalette.unavailable,
};

type RestartKey = WillAppearEvent<KeyLabelSettings>['action'];
type RestartSendToPluginEvent = Parameters<
	NonNullable<SingletonAction<KeyLabelSettings>['onSendToPlugin']>
>[0];

/**
 * Key that restarts the Elgato audio server: it kills the process and waits for it to start again by itself.
 * It shows the check mark once the server is back and the alert on a failure or a timeout.
 * Where the system has no Elgato audio server it is drawn dark and a press only shows the alert.
 * Its default label follows the language, and it answers the language select of its property inspector.
 */
export class RestartElgatoAudioKeyAction extends SingletonAction<KeyLabelSettings> {
	override readonly manifestId = 'com.sonny93.audio.restart-elgato-audio';
	private readonly images = new LocalizedKeyImages((language) =>
		audioMessages.text('elgatoKeyLabel', language)
	);
	private readonly inspector: LanguageInspectorChannel;
	private unsubscribe: (() => void) | undefined;

	constructor(
		private readonly restarter: ElgatoAudioRestarter,
		private readonly languageStore: LanguageStore
	) {
		super();
		this.inspector = new LanguageInspectorChannel(languageStore);
	}

	override async onWillAppear(
		ev: WillAppearEvent<KeyLabelSettings>
	): Promise<void> {
		this.unsubscribe ??= this.languageStore.subscribe(() => {
			this.images.relabel(this.languageStore.current);
			void this.redrawVisibleKeys();
		});
		await this.applySettings(ev.action, ev.payload.settings);
	}

	override async onDidReceiveSettings(
		ev: DidReceiveSettingsEvent<KeyLabelSettings>
	): Promise<void> {
		await this.applySettings(ev.action, ev.payload.settings);
	}

	override onWillDisappear(ev: WillDisappearEvent<KeyLabelSettings>): void {
		this.images.forget(ev.action.id);
		this.inspector.forget(ev.action.id);
		if (this.actions.some(() => true)) {
			return;
		}
		this.unsubscribe?.();
		this.unsubscribe = undefined;
	}

	override async onSendToPlugin(ev: RestartSendToPluginEvent): Promise<void> {
		await this.inspector.handle(ev.action.id, ev.payload);
	}

	override async onPropertyInspectorDidAppear(
		ev: PropertyInspectorDidAppearEvent<KeyLabelSettings>
	): Promise<void> {
		await this.inspector.deliverTo(ev.action.id);
	}

	override async onKeyDown(ev: KeyDownEvent<KeyLabelSettings>): Promise<void> {
		if (!this.restarter.isSupported) {
			await ev.action.showAlert();
			return;
		}
		try {
			const outcome = await this.restarter.restart();
			if (outcome === 'ignored') {
				return;
			}
			await ev.action.showOk();
		} catch (error) {
			streamDeck.logger.warn('Cannot restart the Elgato audio server', error);
			await ev.action.showAlert();
		}
	}

	private async applySettings(
		key: RestartKey,
		rawSettings: unknown
	): Promise<void> {
		if (!key.isKey()) {
			return;
		}
		this.images.keep(key.id, rawSettings, this.languageStore.current);
		await this.draw(key);
	}

	private async draw(
		key: Parameters<LocalizedKeyImages['draw']>[0]
	): Promise<void> {
		await this.images.draw(
			key,
			this.restarter.isSupported ? APPEARANCE : UNAVAILABLE_APPEARANCE
		);
	}

	/** Draws the visible keys again after a language change; it never rejects. */
	private async redrawVisibleKeys(): Promise<void> {
		try {
			await Promise.all(
				this.actions
					.toArray()
					.flatMap((visibleAction) =>
						visibleAction.isKey() ? [this.draw(visibleAction)] : []
					)
			);
		} catch (error) {
			streamDeck.logger.error('Cannot draw the restart key again', error);
		}
	}
}
