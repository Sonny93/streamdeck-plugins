import { streamDeck, SingletonAction } from '@elgato/streamdeck';
import type {
	DidReceiveSettingsEvent,
	KeyDownEvent,
	WillAppearEvent,
	WillDisappearEvent,
} from '@elgato/streamdeck';
import { DrawnKeyImages } from 'deck-kit/keys/drawn_key_images';
import type { KeyAppearance } from 'deck-kit/keys/key_appearance';
import type { KeyLabelSettings } from 'deck-kit/keys/key_label_settings';
import { readKeyLabel } from 'deck-kit/keys/read_key_label';

import type { ElgatoAudioRestarter } from '../../elgato/elgato_audio_restarter';
import { KeyPalette } from '../keys/key_palette';
import { restartGlyph } from '../keys/restart_glyph';

const DEFAULT_LABEL = 'Elgato';
const APPEARANCE: KeyAppearance = {
	glyph: restartGlyph,
	color: KeyPalette.active,
};

type RestartKey = WillAppearEvent<KeyLabelSettings>['action'];

/**
 * Key that restarts the Elgato audio server: it kills the process and waits for it to start again by itself.
 * It shows the check mark once the server is back and the alert on a failure or a timeout.
 */
export class RestartElgatoAudioKeyAction extends SingletonAction<KeyLabelSettings> {
	override readonly manifestId = 'com.sonny93.audio.restart-elgato-audio';
	private readonly images = new DrawnKeyImages();

	constructor(private readonly restarter: ElgatoAudioRestarter) {
		super();
	}

	override async onWillAppear(
		ev: WillAppearEvent<KeyLabelSettings>
	): Promise<void> {
		await this.applySettings(ev.action, ev.payload.settings);
	}

	override async onDidReceiveSettings(
		ev: DidReceiveSettingsEvent<KeyLabelSettings>
	): Promise<void> {
		await this.applySettings(ev.action, ev.payload.settings);
	}

	override onWillDisappear(ev: WillDisappearEvent<KeyLabelSettings>): void {
		this.images.forget(ev.action.id);
	}

	override async onKeyDown(ev: KeyDownEvent<KeyLabelSettings>): Promise<void> {
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
		this.images.setLabel(key.id, readKeyLabel(rawSettings, DEFAULT_LABEL));
		await this.images.draw(key, APPEARANCE);
	}
}
