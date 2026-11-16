import type { Language } from './language';
import { MessageParameterError } from './message_parameter_error';
import type { MessageParameters } from './message_parameters';
import type { MessageText } from './message_text';

const PLACEHOLDER = /\{(\w+)\}/gu;

/**
 * The messages of a plugin, declared once with both languages: the compiler refuses a key that lacks a language.
 * A message is asked for by key and language, with the named values its placeholders need.
 */
export class MessageCatalog<TKey extends string> {
	constructor(private readonly messages: Readonly<Record<TKey, MessageText>>) {}

	/** Every key of the catalog. */
	keys(): readonly TKey[] {
		return Object.keys(this.messages).filter((key): key is TKey =>
			Object.hasOwn(this.messages, key)
		);
	}

	/** The raw text of a message in a language, with its placeholders. */
	raw(key: TKey, language: Language): string {
		return this.messages[key][language];
	}

	/** The text of a message in a language, its placeholders replaced by the parameters. */
	text(
		key: TKey,
		language: Language,
		parameters: MessageParameters = {}
	): string {
		return this.raw(key, language).replaceAll(
			PLACEHOLDER,
			(_placeholder, name: string) => {
				const value = parameters[name];
				if (value === undefined) {
					throw new MessageParameterError(key, name);
				}
				return String(value);
			}
		);
	}
}
