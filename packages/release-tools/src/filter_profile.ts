import { assertNoMultiAction } from './assert_no_multi_action.ts';
import type { ProfileDocument } from './profile_document.ts';
import { removeDisallowedActions } from './remove_disallowed_actions.ts';
import { removeEmptyFolders } from './remove_empty_folders.ts';
import { removeEmptyListedPages } from './remove_empty_listed_pages.ts';

/**
 * Keeps, of a profile, what works with the plugins in `allowedPlugins` (Stream Deck's own `com.elgato.*` actions always work):
 * removes the other plugins' actions, then the folders and listed pages that nothing is left in, with the keys that open them.
 * Throws when the profile holds a multi action.
 */
export function filterProfile(
	options: Readonly<{
		document: ProfileDocument;
		allowedPlugins: ReadonlySet<string>;
	}>
): ProfileDocument {
	assertNoMultiAction({ document: options.document });
	const withoutActions = removeDisallowedActions(options);
	const withoutFolders = removeEmptyFolders({ document: withoutActions });
	return removeEmptyListedPages({ document: withoutFolders });
}
