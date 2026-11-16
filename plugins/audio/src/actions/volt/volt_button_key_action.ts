import { streamDeck, SingletonAction } from '@elgato/streamdeck';
import type {
	DidReceiveSettingsEvent,
	PropertyInspectorDidAppearEvent,
	KeyDownEvent,
	WillAppearEvent,
	WillDisappearEvent,
} from '@elgato/streamdeck';
import type { Language } from 'deck-kit/i18n/language';
import type { LanguageStore } from 'deck-kit/i18n/language_store';
import type { KeyLabelSettings } from 'deck-kit/keys/key_label_settings';

import type { VoltButton } from '../../volt/volt_button';
import type { VoltHub } from '../../volt/volt_hub';
import type { VoltStatus } from '../../volt/volt_status';
import { LocalizedKeyImages } from '../keys/localized_key_images';
import { toggleKeyAppearance } from '../keys/toggle_key_appearance';
import { LanguageInspectorChannel } from '../language/language_inspector_channel';
import { resolveVoltKeyState } from './resolve_volt_key_state';

type VoltKey = WillAppearEvent<KeyLabelSettings>['action'];
type VoltSendToPluginEvent = Parameters<
	NonNullable<SingletonAction<KeyLabelSettings>['onSendToPlugin']>
>[0];

/**
 * Key that shows whether a front panel button of the Volt 1 is on, and flips it when pressed.
 * It draws its label, typed in its settings or the name of the button, in the color of its icon,
 * follows the language, and answers the language select of its property inspector.
 */
export abstract class VoltButtonKeyAction extends SingletonAction<KeyLabelSettings> {
	protected abstract readonly button: VoltButton;
	protected abstract readonly glyph: (color: string) => string;
	private readonly images = new LocalizedKeyImages((language) =>
		this.defaultLabel(language)
	);
	private readonly inspector: LanguageInspectorChannel;
	private unsubscribe: (() => void) | undefined;

	constructor(
		private readonly hub: VoltHub,
		private readonly languageStore: LanguageStore
	) {
		super();
		this.inspector = new LanguageInspectorChannel(languageStore);
	}

	protected abstract defaultLabel(language: Language): string;

	override async onWillAppear(
		ev: WillAppearEvent<KeyLabelSettings>
	): Promise<void> {
		this.images.keep(
			ev.action.id,
			ev.payload.settings,
			this.languageStore.current
		);
		this.unsubscribe ??= this.subscribeToChanges();
		await this.render(ev.action, this.hub.current);
	}

	override async onDidReceiveSettings(
		ev: DidReceiveSettingsEvent<KeyLabelSettings>
	): Promise<void> {
		this.images.keep(
			ev.action.id,
			ev.payload.settings,
			this.languageStore.current
		);
		await this.render(ev.action, this.hub.current);
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

	override async onSendToPlugin(ev: VoltSendToPluginEvent): Promise<void> {
		await this.inspector.handle(ev.action.id, ev.payload);
	}

	override async onPropertyInspectorDidAppear(
		ev: PropertyInspectorDidAppearEvent<KeyLabelSettings>
	): Promise<void> {
		await this.inspector.deliverTo(ev.action.id);
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

	/** Follows the Volt 1 and the language: any change draws the visible keys again. */
	private subscribeToChanges(): () => void {
		const stops = [
			this.hub.subscribe((status) => {
				void this.refreshVisibleKeys(status);
			}),
			this.languageStore.subscribe(() => {
				this.images.relabel(this.languageStore.current);
				void this.refreshVisibleKeys(this.hub.current);
			}),
		];
		return () => {
			for (const stop of stops) {
				stop();
			}
		};
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
