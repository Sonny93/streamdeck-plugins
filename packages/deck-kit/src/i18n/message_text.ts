import type { Language } from './language';

/** The text of one message in each language, where `{name}` marks a value given when the message is asked for. */
export type MessageText = Readonly<Record<Language, string>>;
