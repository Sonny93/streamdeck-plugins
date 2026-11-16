import { streamDeck } from '@elgato/streamdeck';
import type { LanguageStore } from 'deck-kit/i18n/language_store';
import { LanguagePanel } from 'deck-kit/inspector/language_panel';
import { PropertyInspectorReplies } from 'deck-kit/ui/property_inspector_replies';

type PropertyInspectorPayload = Parameters<
	typeof streamDeck.ui.sendToPropertyInspector
>[0];

/**
 * What an action holds to talk with its property inspector: the answers kept for inspectors not open yet,
 * and the language select every inspector of the plugin shares. Its methods never throw.
 */
export class LanguageInspectorChannel {
	readonly replies = new PropertyInspectorReplies<PropertyInspectorPayload>({
		readCurrentActionId: () => streamDeck.ui.action?.id,
		sendToCurrent: (payload) => streamDeck.ui.sendToPropertyInspector(payload),
	});

	private readonly languagePanel: LanguagePanel;

	constructor(languageStore: LanguageStore) {
		this.languagePanel = new LanguagePanel({
			languageStore,
			reply: (actionId, event, payload) =>
				this.replies.reply({ actionId, event, payload }),
		});
	}

	/** Handles a message of an inspector when it is about the language; tells whether it was. */
	async handle(actionId: string, payload: unknown): Promise<boolean> {
		try {
			return await this.languagePanel.handle(actionId, payload);
		} catch (error) {
			streamDeck.logger.error('Cannot answer the language select', error);
			return true;
		}
	}

	/** Sends the kept answers and the language to the inspector of an action that appeared. */
	async deliverTo(actionId: string): Promise<void> {
		try {
			await this.replies.deliverPending(actionId);
			await this.languagePanel.announce(actionId);
		} catch (error) {
			streamDeck.logger.error('Cannot send the language', error);
		}
	}

	forget(actionId: string): void {
		this.replies.forget(actionId);
	}
}
