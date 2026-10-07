import type { WillAppearEvent } from '@elgato/streamdeck';

import { LikeKeyState } from './like_key_state';

/** Shows the filled heart on a "Like" key when the playing track is in the like target, and the outline heart otherwise. */
export async function setLikeKeyState(
	action: WillAppearEvent['action'],
	isInTarget: boolean
): Promise<void> {
	if (!action.isKey()) {
		return;
	}
	await action.setState(
		isInTarget ? LikeKeyState.inTarget : LikeKeyState.notInTarget
	);
}
