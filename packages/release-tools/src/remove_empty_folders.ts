import { filterPageActions } from './filter_page_actions.ts';
import { listPageActions } from './list_page_actions.ts';
import { mapProfilePages } from './map_profile_pages.ts';
import { ProfileActionUuids } from './profile_action_uuids.ts';
import type { JsonRecord, ProfileDocument } from './profile_document.ts';
import { readOpenedFolder } from './read_opened_folder.ts';
import { readPageIndex } from './read_page_index.ts';

function isEmptyFolder(manifest: JsonRecord | undefined): boolean {
	return (
		manifest !== undefined &&
		listPageActions({ manifest }).every(
			(action) => action['UUID'] === ProfileActionUuids.backToParent
		)
	);
}

function listEmptyFolders(document: ProfileDocument): ReadonlySet<string> {
	const { defaultPage } = readPageIndex({
		rootManifest: document.rootManifest,
	});
	const openedFolders = [...document.pages.values()].flatMap((manifest) =>
		listPageActions({ manifest }).map((action) => readOpenedFolder({ action }))
	);
	return new Set(
		openedFolders.filter(
			(folderId): folderId is string =>
				folderId !== undefined &&
				folderId !== defaultPage &&
				isEmptyFolder(document.pages.get(folderId))
		)
	);
}

/**
 * Removes the folders that hold nothing but Back keys, with the Create Folder keys that open them.
 * Removing a folder can empty its parent, so it repeats until every remaining folder holds something.
 */
export function removeEmptyFolders(
	options: Readonly<{ document: ProfileDocument }>
): ProfileDocument {
	const { document } = options;
	const emptyFolders = listEmptyFolders(document);
	if (emptyFolders.size === 0) {
		return document;
	}
	const withoutKeys = mapProfilePages({
		document,
		transform: (manifest) =>
			filterPageActions({
				manifest,
				shouldKeep: (action) => {
					const folderId = readOpenedFolder({ action });
					return folderId === undefined || !emptyFolders.has(folderId);
				},
			}),
	});
	return removeEmptyFolders({
		document: {
			rootManifest: withoutKeys.rootManifest,
			pages: new Map(
				[...withoutKeys.pages].filter(([pageId]) => !emptyFolders.has(pageId))
			),
		},
	});
}
