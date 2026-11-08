import { listPageActions } from './list_page_actions.ts';
import { ProfileActionUuids } from './profile_action_uuids.ts';
import type { ProfileDocument } from './profile_document.ts';
import { readActionPluginUuid } from './read_action_plugin_uuid.ts';
import { readOpenedFolder } from './read_opened_folder.ts';
import { readPageIndex } from './read_page_index.ts';

function listOpenedFolders(
	options: Readonly<{ document: ProfileDocument; pageId: string }>
): string[] {
	const manifest = options.document.pages.get(options.pageId);
	if (manifest === undefined) {
		return [];
	}
	return listPageActions({ manifest }).flatMap((action) => {
		const folderId = readOpenedFolder({ action });
		return folderId === undefined ? [] : [folderId];
	});
}

function listReachablePages(
	options: Readonly<{ document: ProfileDocument; roots: readonly string[] }>
): ReadonlySet<string> {
	const reached = new Set<string>();
	const pending = [...options.roots];
	for (
		let pageId = pending.pop();
		pageId !== undefined;
		pageId = pending.pop()
	) {
		if (reached.has(pageId)) {
			continue;
		}
		reached.add(pageId);
		pending.push(...listOpenedFolders({ document: options.document, pageId }));
	}
	return reached;
}

function listPluginProblems(
	options: Readonly<{
		document: ProfileDocument;
		allowedPlugins: ReadonlySet<string>;
	}>
): string[] {
	return [...options.document.pages].flatMap(([pageId, manifest]) =>
		listPageActions({ manifest }).flatMap((action) => {
			const pluginUuid = readActionPluginUuid({ action });
			if (pluginUuid.startsWith(ProfileActionUuids.multiActionsPrefix)) {
				return [`page ${pageId} holds the multi action ${pluginUuid}`];
			}
			const isAllowed =
				pluginUuid.startsWith(ProfileActionUuids.elgatoPrefix) ||
				options.allowedPlugins.has(pluginUuid);
			return isAllowed
				? []
				: [`page ${pageId} holds an action of ${pluginUuid}`];
		})
	);
}

/**
 * Lists what is wrong in a profile, as sentences; an empty list means it is sound:
 * a missing default, listed or opened page, a page nothing leads to, and actions of a plugin that is neither allowed nor Stream Deck's own.
 */
export function listProfileIntegrityProblems(
	options: Readonly<{
		document: ProfileDocument;
		allowedPlugins: ReadonlySet<string>;
	}>
): string[] {
	const { document, allowedPlugins } = options;
	const { defaultPage, listedPages } = readPageIndex({
		rootManifest: document.rootManifest,
	});
	const roots = [defaultPage, ...listedPages];
	const reachable = listReachablePages({ document, roots });
	return [
		...roots
			.filter((pageId) => !document.pages.has(pageId))
			.map((pageId) => `the default or listed page ${pageId} does not exist`),
		...[...reachable]
			.filter((pageId) => !document.pages.has(pageId))
			.filter((pageId) => !roots.includes(pageId))
			.map(
				(pageId) => `a Create Folder key opens ${pageId}, which does not exist`
			),
		...[...document.pages.keys()]
			.filter((pageId) => !reachable.has(pageId))
			.map(
				(pageId) =>
					`page ${pageId} is not the default, not listed and opened by no folder`
			),
		...listPluginProblems({ document, allowedPlugins }),
	];
}
