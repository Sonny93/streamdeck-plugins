import type { Language } from './language';

/** What the user picks for the language of a plugin: follow the system, or force a language. */
export type LanguageSetting = 'system' | Language;
