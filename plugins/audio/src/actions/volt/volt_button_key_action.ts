import { streamDeck, SingletonAction } from '@elgato/streamdeck';
import type {
	DidReceiveSettingsEvent,
	KeyDownEvent,
	WillAppearEvent,
	WillDisappearEvent,
} from '@elgato/streamdeck';
import { DrawnKeyImages } from 'deck-kit/keys/drawn_key_images';
import type { KeyLabelSettings } from 'deck-kit/keys/key_label_settings';
import { readKeyLabel } from 'deck-kit/keys/read_key_label';

import type { VoltButton } from '../../volt/volt_button';
import type { VoltHub } from '../../volt/volt_hub';
import type { VoltStatus } from '../../volt/volt_status';
import { toggleKeyAppearance } from '../keys/toggle_key_appearance';
import { resolveVoltKeyState } from './resolve_volt_key_state';

type VoltKey = WillAppearEvent<KeyLabelSettings>['action'];

/**
 * Key that shows whether a front panel button of the Volt 1 is on, and flips it when pressed.
 * It draws its label, typed in its settings or the name of the button, in the color of its icon.
 */
export abstract class VoltButtonKeyAction extends SingletonAction<KeyLabelSettings> {
	protected abstract readonly button: VoltButton;
	protected abstract readonly defaultLabel: string;
	protected abstract readonly glyph: (color: string) => string;
	private readonly images = new DrawnKeyImages();
	private unsubscribe: (() => void) | undefined;

	constructor(private readonly hub: VoltHub) {
		super();
	}

	override async onWillAppear(
		ev: WillAppearEvent<KeyLabelSettings>
	): Promise<void> {
		this.images.setLabel(
			ev.action.id,
			readKeyLabel(ev.payload.settings, this.defaultLabel)
		);
		this.unsubscribe ??= this.hub.subscribe((status) => {
			void this.refreshVisibleKeys(status);
		});
		await this.render(ev.action, this.hub.current);
	}

	override async onDidReceiveSettings(
		ev: DidReceiveSettingsEvent<KeyLabelSettings>
	): Promise<void> {
		this.images.setLabel(
			ev.action.id,
			readKeyLabel(ev.payload.settings, this.defaultLabel)
		);
		await this.render(ev.action, this.hub.current);
	}

	override onWillDisappear(ev: WillDisappearEvent<KeyLabelSettings>): void {
		this.images.forget(ev.action.id);
		if (this.actions.some(() => true)) {
			return;
		}
		this.unsubscribe?.();
		this.unsubscribe = undefined;
	}

	override async onKeyDown(ev: KeyDownEvent<KeyLabelSettings>): Promise<void> {
		try {
			await this.hub.toggleButton(this.button);
		} catch (error) {
			streamDeck.logger.warn(`Cannot flip ${this.button} on the Volt 1`, error);
			await ev.action.showAlert();
		}
	}

	private async render(key: VoltKey, status: VoltStatus): Promise<void> {
		if (!key.isKey()) {
			return;
		}
		const state = resolveVoltKeyState(status, this.button);
		await key.setState(state);
		await this.images.draw(key, toggleKeyAppearance(this.glyph, state));
	}

	private async refreshVisibleKeys(status: VoltStatus): Promise<void> {
		try {
			await Promise.all(
				this.actions
					.toArray()
					.map((visibleAction) => this.render(visibleAction, status))
			);
		} catch (error) {
			streamDeck.logger.error(
				`Cannot update the ${this.button} key of the Volt 1`,
				error
			);
		}
	}
}
