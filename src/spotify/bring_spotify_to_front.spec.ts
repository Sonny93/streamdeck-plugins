import { describe, expect, it, vi } from 'vitest';

import type { SpotifySession } from './spotify_session';
import { bringSpotifyToFront } from './bring_spotify_to_front';
import { activateProcessWindow } from '../windows/activate_process_window';

vi.mock('../windows/activate_process_window');

const BROWSER_PROCESS_ID = 4321;

function buildSession(): SpotifySession {
	const send = vi.fn(() =>
		Promise.resolve({
			processInfo: [
				{ type: 'renderer', id: 11 },
				{ type: 'browser', id: BROWSER_PROCESS_ID },
			],
		})
	);
	const connection = { send, close: vi.fn() };
	return {
		browser: connection,
		page: connection,
		pageTargetId: 'target-1',
		launchedByPlugin: false,
	};
}

describe('bringSpotifyToFront', () => {
	it('should activate the window of the Spotify browser process', async () => {
		await bringSpotifyToFront(buildSession());

		expect(activateProcessWindow).toHaveBeenCalledWith(BROWSER_PROCESS_ID);
	});
});
