import { BuiltInActions } from './built_in_actions.ts';
import type { PageAction } from './page_action.ts';
import type { ProfileFolder } from './profile_folder.ts';

/** Builds the key that opens a folder; it points to the folder page by its lowercase UUID, as the Stream Deck app writes it. */
export function buildOpenFolderAction(folder: ProfileFolder): PageAction {
	const { openFolder, version } = BuiltInActions;
	return {
		ActionID: folder.actionId,
		LinkedTitle: true,
		Name: openFolder.name,
		Plugin: { Name: openFolder.name, UUID: openFolder.uuid, Version: version },
		Resources: null,
		Settings: { ProfileUUID: folder.pageUuid.toLowerCase() },
		State: 0,
		States: [{}],
		UUID: openFolder.uuid,
	};
}
