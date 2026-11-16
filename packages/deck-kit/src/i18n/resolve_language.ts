import type { Language } from './language';
import type { LanguageSetting } from './language_setting';

const LANGUAGE_PART = /^[A-Za-z]+/u;

/** The language of the system locale: French for any `fr` locale (`fr_CA.UTF-8`, `fr-FR`), English for everything else. */
function readSystemLanguage(systemLocale: string): Language {
	const code = LANGUAGE_PART.exec(systemLocale.trim())?.[0]?.toLowerCase();
	return code === 'fr' ? 'fr' : 'en';
}

/** The language to draw in: the forced one, or the one of the system locale when the setting follows the system. */
export function resolveLanguage(
	setting: LanguageSetting,
	systemLocale: string
): Language {
	return setting === 'system' ? readSystemLanguage(systemLocale) : setting;
}
