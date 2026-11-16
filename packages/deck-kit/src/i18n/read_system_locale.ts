const POSIX_VARIABLES = ['LC_ALL', 'LC_MESSAGES', 'LANG'] as const;
const NEUTRAL_LOCALE = /^(?:C|POSIX)(?:[.@].*)?$/u;

export type SystemLocaleSources = Readonly<{
	environment: Readonly<Record<string, string | undefined>>;
	/** The locale of the runtime, for systems that set no POSIX variable (Windows). */
	readIntlLocale: () => string;
}>;

/**
 * The locale of the system, as a string like `fr_FR.UTF-8` or `fr-FR`.
 * It is the first of `LC_ALL`, `LC_MESSAGES` and `LANG` that is set and not empty, in the POSIX order of precedence;
 * when none is set, or the one found is the neutral `C` or `POSIX` locale, it is the locale of the runtime.
 */
export function readSystemLocale(sources: SystemLocaleSources): string {
	const found = POSIX_VARIABLES.map((name) => sources.environment[name]).find(
		(value) => value !== undefined && value !== ''
	);
	if (found === undefined || NEUTRAL_LOCALE.test(found)) {
		return sources.readIntlLocale();
	}
	return found;
}
