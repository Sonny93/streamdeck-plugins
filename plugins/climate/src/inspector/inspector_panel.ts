import { streamDeck } from '@elgato/streamdeck';
import type { LanguageStore } from 'deck-kit/i18n/language_store';
import { PropertyInspectorReplies } from 'deck-kit/ui/property_inspector_replies';

import { climateMessages } from '../i18n/climate_messages';
import { describeSaveOutcome } from '../unit_address/describe_save_outcome';
import type { SaveUnitAddressOutcome } from '../unit_address/save_unit_address';
import { inspectorMessageSchema } from './inspector_message_schema';

type PropertyInspectorPayload = Parameters<
	typeof streamDeck.ui.sendToPropertyInspector
>[0];

const ADDRESS_EVENT = 'unitAddress';
const LANGUAGE_EVENT = 'language';
const SAVE_RESULT_EVENT = 'saveUnitAddressResult';

export type InspectorPanelOptions = Readonly<{
	readHost: () => string | undefined;
	saveAddress: (address: string) => Promise<SaveUnitAddressOutcome>;
	languageStore: Pick<LanguageStore, 'setting' | 'current' | 'save'>;
}>;

/**
 * Talks to the part that every property inspector of the plugin shares: the "Air conditioner address" field and the language select.
 * The inspector asks for the current address and language, and sends the address or the language to save; the plugin answers with them,
 * and with a message once an address save ends. The answers are kept per action and sent when its inspector appears,
 * because OpenDeck loads every inspector at startup and only announces the one the user opens.
 */
export class InspectorPanel {
	private readonly replies =
		new PropertyInspectorReplies<PropertyInspectorPayload>({
			readCurrentActionId: () => streamDeck.ui.action?.id,
			sendToCurrent: (payload) =>
				streamDeck.ui.sendToPropertyInspector(payload),
		});

	constructor(private readonly options: InspectorPanelOptions) {}

	/** Handles a message of an inspector; it never throws. */
	async handleMessage(actionId: string, payload: unknown): Promise<void> {
		const message = inspectorMessageSchema.safeParse(payload);
		if (!message.success) {
			return;
		}
		try {
			switch (message.data.event) {
				case 'getUnitAddress':
					await this.announceAddress(actionId);
					return;
				case 'saveUnitAddress':
					await this.saveAddress(actionId, message.data.address);
					return;
				case 'getLanguage':
					await this.announceLanguage(actionId);
					return;
				case 'saveLanguage':
					await this.options.languageStore.save(message.data.setting);
					await this.announceLanguage(actionId);
					return;
			}
		} catch (error) {
			streamDeck.logger.error('Cannot answer the shared settings', error);
		}
	}

	/** Sends the current address and language to the inspector of an action, to call when it appears. */
	async announce(actionId: string): Promise<void> {
		await this.announceAddress(actionId);
		await this.announceLanguage(actionId);
	}

	forget(actionId: string): void {
		this.replies.forget(actionId);
	}

	private async announceAddress(actionId: string): Promise<void> {
		await this.replySafely(actionId, ADDRESS_EVENT, {
			event: ADDRESS_EVENT,
			address: this.options.readHost() ?? '',
		});
	}

	private async announceLanguage(actionId: string): Promise<void> {
		const { setting, current } = this.options.languageStore;
		await this.replySafely(actionId, LANGUAGE_EVENT, {
			event: LANGUAGE_EVENT,
			setting,
			language: current,
		});
	}

	private async replySafely(
		actionId: string,
		event: string,
		payload: PropertyInspectorPayload
	): Promise<void> {
		try {
			await this.replies.reply({ actionId, event, payload });
		} catch (error) {
			streamDeck.logger.error('Cannot send a setting to the inspector', error);
		}
	}

	private async saveAddress(actionId: string, address: string): Promise<void> {
		const outcome = await this.saveAndDescribe(address);
		await streamDeck.ui.sendToPropertyInspector({
			event: SAVE_RESULT_EVENT,
			isSaved: outcome.isSaved,
			message: outcome.text,
		});
		if (outcome.isSaved) {
			await this.announceAddress(actionId);
		}
	}

	private async saveAndDescribe(
		address: string
	): Promise<Readonly<{ isSaved: boolean; text: string }>> {
		const language = this.options.languageStore.current;
		try {
			const outcome = await this.options.saveAddress(address);
			return {
				isSaved: outcome === 'saved',
				text: describeSaveOutcome(outcome, language),
			};
		} catch (error) {
			streamDeck.logger.error('Cannot save the unit address', error);
			return {
				isSaved: false,
				text: climateMessages.text('addressSaveFailed', language),
			};
		}
	}
}
