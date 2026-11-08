import { listPageActions } from './list_page_actions.ts';
import { ProfileActionUuids } from './profile_action_uuids.ts';
import type { ProfileDocument } from './profile_document.ts';
import { readActionPluginUuid } from './read_action_plugin_uuid.ts';
import { UnsupportedProfileActionError } from './unsupported_profile_action_error.ts';

/** Throws when a page of the profile holds a multi action, since it nests actions of other plugins. */
export function assertNoMultiAction(
	options: Readonly<{ document: ProfileDocument }>
): void {
	for (const manifest of options.document.pages.values()) {
		for (const action of listPageActions({ manifest })) {
			const pluginUuid = readActionPluginUuid({ action });
			if (pluginUuid.startsWith(ProfileActionUuids.multiActionsPrefix)) {
				throw new UnsupportedProfileActionError({ pluginUuid });
			}
		}
	}
}
