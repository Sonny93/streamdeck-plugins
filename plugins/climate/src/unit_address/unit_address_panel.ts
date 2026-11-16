import { streamDeck } from '@elgato/streamdeck';
import { PropertyInspectorReplies } from 'deck-kit/ui/property_inspector_replies';

import { describeSaveOutcome } from './describe_save_outcome';
import type { SaveUnitAddressOutcome } from './save_unit_address';
import { unitAddressMessageSchema } from './unit_address_message_schema';

type PropertyInspectorPayload = Parameters<
	typeof streamDeck.ui.sendToPropertyInspector
>[0];

const ADDRESS_EVENT = 'unitAddress';
const SAVE_RESULT_EVENT = 'saveUnitAddressResult';
const SAVE_FAILED_MESSAGE = "L'adresse n'a pas pu être enregistrée.";

export type UnitAddressPanelOptions = Readonly<{
	readHost: () => string | undefined;
	saveAddress: (address: string) => Promise<SaveUnitAddressOutcome>;
}>;

/**
 * Talks to the "Air conditioner address" field that every property inspector of the plugin shows.
 * The inspector asks for the current address and sends the address to save; the plugin answers with the address,
 * and with a message once a save ends. The address answers are kept per action and sent when its inspector appears,
 * because OpenDeck loads every inspector at startup and only announces the one the user opens.
 */
export class UnitAddressPanel {
	private readonly replies =
		new PropertyInspectorReplies<PropertyInspectorPayload>({
			readCurrentActionId: () => streamDeck.ui.action?.id,
			sendToCurrent: (payload) =>
				streamDeck.ui.sendToPropertyInspector(payload),
		});

	constructor(private readonly options: UnitAddressPanelOptions) {}

	/** Handles a message of an inspector; it never throws. */
	async handleMessage(actionId: string, payload: unknown): Promise<void> {
		const message = unitAddressMessageSchema.safeParse(payload);
		if (!message.success) {
			return;
		}
		try {
			if (message.data.event === 'getUnitAddress') {
				await this.announce(actionId);
				return;
			}
			await this.save(actionId, message.data.address);
		} catch (error) {
			streamDeck.logger.error('Cannot answer the address field', error);
		}
	}

	/** Sends the current address to the inspector of an action, to call when it appears. */
	async announce(actionId: string): Promise<void> {
		try {
			await this.replies.reply({
				actionId,
				event: ADDRESS_EVENT,
				payload: {
					event: ADDRESS_EVENT,
					address: this.options.readHost() ?? '',
				},
			});
		} catch (error) {
			streamDeck.logger.error('Cannot send the unit address', error);
		}
	}

	forget(actionId: string): void {
		this.replies.forget(actionId);
	}

	private async save(actionId: string, address: string): Promise<void> {
		const message = await this.saveAndDescribe(address);
		await streamDeck.ui.sendToPropertyInspector({
			event: SAVE_RESULT_EVENT,
			isSaved: message.isSaved,
			message: message.text,
		});
		if (message.isSaved) {
			await this.announce(actionId);
		}
	}

	private async saveAndDescribe(
		address: string
	): Promise<Readonly<{ isSaved: boolean; text: string }>> {
		try {
			const outcome = await this.options.saveAddress(address);
			return {
				isSaved: outcome === 'saved',
				text: describeSaveOutcome(outcome),
			};
		} catch (error) {
			streamDeck.logger.error('Cannot save the unit address', error);
			return { isSaved: false, text: SAVE_FAILED_MESSAGE };
		}
	}
}
