import { filterPageActions } from './filter_page_actions.ts';
import { mapProfilePages } from './map_profile_pages.ts';
import { ProfileActionUuids } from './profile_action_uuids.ts';
import type { ProfileDocument } from './profile_document.ts';
import { readActionPluginUuid } from './read_action_plugin_uuid.ts';

/** Removes the keys and dials of every plugin that is neither a Stream Deck plugin nor in `allowedPlugins`. */
export function removeDisallowedActions(
	options: Readonly<{
		document: ProfileDocument;
		allowedPlugins: ReadonlySet<string>;
	}>
): ProfileDocument {
	const { document, allowedPlugins } = options;
	return mapProfilePages({
		document,
		transform: (manifest) =>
			filterPageActions({
				manifest,
				shouldKeep: (action) => {
					const pluginUuid = readActionPluginUuid({ action });
					return (
						pluginUuid.startsWith(ProfileActionUuids.elgatoPrefix) ||
						allowedPlugins.has(pluginUuid)
					);
				},
			}),
	});
}
