import { ProfileActionUuids } from './profile_action_uuids.ts';
import type { JsonRecord } from './profile_document.ts';

/** Builds a Create Folder key that opens a folder, for tests. */
export function buildTestOpenFolderAction(
	options: Readonly<{ folderId: string }>
): JsonRecord {
	return {
		Plugin: { UUID: ProfileActionUuids.openChild },
		Settings: { ProfileUUID: options.folderId },
		UUID: ProfileActionUuids.openChild,
	};
}
