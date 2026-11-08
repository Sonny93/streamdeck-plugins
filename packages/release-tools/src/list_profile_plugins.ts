import { compareCodeUnits } from './compare_code_units.ts';
import { listPageActions } from './list_page_actions.ts';
import { ProfileActionUuids } from './profile_action_uuids.ts';
import type { ProfileDocument } from './profile_document.ts';
import { readActionPluginUuid } from './read_action_plugin_uuid.ts';

/** Lists, sorted, the plugins other than Stream Deck's own that the actions of a profile belong to. */
export function listProfilePlugins(
	options: Readonly<{ document: ProfileDocument }>
): string[] {
	const pluginUuids = [...options.document.pages.values()].flatMap((manifest) =>
		listPageActions({ manifest }).map((action) =>
			readActionPluginUuid({ action })
		)
	);
	return [...new Set(pluginUuids)]
		.filter(
			(pluginUuid) => !pluginUuid.startsWith(ProfileActionUuids.elgatoPrefix)
		)
		.sort(compareCodeUnits);
}
