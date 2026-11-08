import { InvalidProfileError } from './invalid_profile_error.ts';
import { isNavigationAction } from './is_navigation_action.ts';
import { isRecord } from './is_record.ts';
import { listPageActions } from './list_page_actions.ts';
import { NO_CURRENT_PAGE } from './profile_action_uuids.ts';
import type { JsonRecord, ProfileDocument } from './profile_document.ts';
import { readPageIndex } from './read_page_index.ts';

function holdsOnlyNavigation(manifest: JsonRecord): boolean {
	return listPageActions({ manifest }).every((action) =>
		isNavigationAction({ action })
	);
}

function buildPagesSetting(
	options: Readonly<{
		rootManifest: JsonRecord;
		removedPages: ReadonlySet<string>;
	}>
): JsonRecord {
	const { rootManifest, removedPages } = options;
	const pages = rootManifest['Pages'];
	if (!isRecord(pages) || !Array.isArray(pages['Pages'])) {
		throw new InvalidProfileError({
			reason: 'The profile manifest has no Pages',
		});
	}
	const isRemoved = (pageId: unknown): boolean =>
		typeof pageId === 'string' && removedPages.has(pageId.toLowerCase());
	return {
		...pages,
		Current: isRemoved(pages['Current']) ? NO_CURRENT_PAGE : pages['Current'],
		Pages: pages['Pages'].filter((pageId) => !isRemoved(pageId)),
	};
}

/**
 * Removes the pages listed after the default one that hold nothing but Back or Switch Profile keys, and keeps `Pages.Current` valid.
 * The default page is never removed, and the pages stay when removing them would leave no listed page.
 */
export function removeEmptyListedPages(
	options: Readonly<{ document: ProfileDocument }>
): ProfileDocument {
	const { document } = options;
	const { listedPages } = readPageIndex({
		rootManifest: document.rootManifest,
	});
	const emptyPages = new Set(
		listedPages.filter((pageId) =>
			holdsOnlyNavigation(document.pages.get(pageId) ?? {})
		)
	);
	if (emptyPages.size === 0 || emptyPages.size === listedPages.length) {
		return document;
	}
	return {
		rootManifest: {
			...document.rootManifest,
			Pages: buildPagesSetting({
				rootManifest: document.rootManifest,
				removedPages: emptyPages,
			}),
		},
		pages: new Map(
			[...document.pages].filter(([pageId]) => !emptyPages.has(pageId))
		),
	};
}
