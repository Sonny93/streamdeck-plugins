import { InvalidProfileError } from './invalid_profile_error.ts';
import { isRecord } from './is_record.ts';
import type { JsonRecord } from './profile_document.ts';

/** The page identifiers a root manifest declares, lower-cased. */
export type PageIndex = Readonly<{
	current: string;
	defaultPage: string;
	listedPages: readonly string[];
}>;

/** Reads `Pages.Current`, `Pages.Default` and `Pages.Pages` from a root manifest, with the identifiers lower-cased. */
export function readPageIndex(
	options: Readonly<{ rootManifest: JsonRecord }>
): PageIndex {
	const pages = options.rootManifest['Pages'];
	if (
		!isRecord(pages) ||
		typeof pages['Current'] !== 'string' ||
		typeof pages['Default'] !== 'string' ||
		!Array.isArray(pages['Pages']) ||
		!pages['Pages'].every((page) => typeof page === 'string')
	) {
		throw new InvalidProfileError({
			reason:
				'The profile manifest has no valid Pages with Current, Default and Pages',
		});
	}
	return {
		current: pages['Current'].toLowerCase(),
		defaultPage: pages['Default'].toLowerCase(),
		listedPages: pages['Pages'].map((page: string) => page.toLowerCase()),
	};
}
