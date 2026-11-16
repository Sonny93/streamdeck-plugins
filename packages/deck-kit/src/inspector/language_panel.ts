import type { LanguageStore } from '../i18n/language_store';
import type { JsonObject } from '../settings/json_object';
import { languageMessageSchema } from './language_message_schema';

export const LANGUAGE_EVENT = 'language';

export type LanguagePanelOptions = Readonly<{
	languageStore: Pick<LanguageStore, 'setting' | 'current' | 'save'>;
	/** Sends a payload to the inspector of an action; the plugin gives its own way, which keeps the answers for inspectors not open yet. */
	reply: (
		actionId: string,
		event: string,
		payload: JsonObject
	) => Promise<void>;
}>;

/**
 * Answers the language select that the property inspectors of a plugin share, with `language_inspector.js` on the browser side.
 * The inspector asks for the language setting and sends the one the user picks; the plugin saves it, which redraws everything
 * that follows the language store, and answers with the setting and the language it resolves to.
 */
export class LanguagePanel {
	constructor(private readonly options: LanguagePanelOptions) {}

	/** Handles a message of an inspector when it is about the language; tells whether it was. Errors are left to the caller. */
	async handle(actionId: string, payload: unknown): Promise<boolean> {
		const message = languageMessageSchema.safeParse(payload);
		if (!message.success) {
			return false;
		}
		if (message.data.event === 'saveLanguage') {
			await this.options.languageStore.save(message.data.setting);
		}
		await this.announce(actionId);
		return true;
	}

	/** Sends the language setting and the language it resolves to, to call when an inspector appears. */
	async announce(actionId: string): Promise<void> {
		const { setting, current } = this.options.languageStore;
		await this.options.reply(actionId, LANGUAGE_EVENT, {
			event: LANGUAGE_EVENT,
			setting,
			language: current,
		});
	}
}
