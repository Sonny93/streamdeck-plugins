import { ProfileActionUuids } from './profile_action_uuids.ts';
import type { JsonRecord } from './profile_document.ts';

/** Tells whether an action is a Back or a Switch Profile key, which gives a page nothing to show on its own. */
export function isNavigationAction(
	options: Readonly<{ action: JsonRecord }>
): boolean {
	const uuid = options.action['UUID'];
	return (
		uuid === ProfileActionUuids.backToParent ||
		uuid === ProfileActionUuids.rotate
	);
}
