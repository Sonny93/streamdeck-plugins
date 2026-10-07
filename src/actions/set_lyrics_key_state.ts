import type { WillAppearEvent } from '@elgato/streamdeck';

import { LyricsKeyState } from './lyrics_key_state';

/** Shows the available or the greyed unavailable image on a "Toggle lyrics" key. */
export async function setLyricsKeyState(
	action: WillAppearEvent['action'],
	isLyricsAvailable: boolean
): Promise<void> {
	if (!action.isKey()) {
		return;
	}
	await action.setState(
		isLyricsAvailable ? LyricsKeyState.available : LyricsKeyState.unavailable
	);
}
