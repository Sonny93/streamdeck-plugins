import { describe, expect, it, vi } from 'vitest';

import { buildFakeSpotifyHost } from '../platform/build_fake_spotify_host';
import { bringSpotifyToFront } from './bring_spotify_to_front';
import type { SpotifySession } from './spotify_session';

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
		const host = buildFakeSpotifyHost();

		await bringSpotifyToFront(buildSession(), host);

		expect(host.activateWindow).toHaveBeenCalledWith(BROWSER_PROCESS_ID);
	});
});
