import { isRecord } from './is_record.ts';
import { ProfileActionUuids } from './profile_action_uuids.ts';
import type { JsonRecord } from './profile_document.ts';

/** Returns the lower-case identifier of the folder that an action opens, or `undefined` when it is not a Create Folder key. */
export function readOpenedFolder(
	options: Readonly<{ action: JsonRecord }>
): string | undefined {
	const { action } = options;
	const settings = action['Settings'];
	if (
		action['UUID'] !== ProfileActionUuids.openChild ||
		!isRecord(settings) ||
		typeof settings['ProfileUUID'] !== 'string'
	) {
		return undefined;
	}
	return settings['ProfileUUID'].toLowerCase();
}
