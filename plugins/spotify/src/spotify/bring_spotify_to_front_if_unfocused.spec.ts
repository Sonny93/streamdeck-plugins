import { describe, expect, it, vi } from 'vitest';

import { activateProcessWindow } from '../windows/activate_process_window';
import { isProcessInForeground } from '../windows/is_process_in_foreground';
import { bringSpotifyToFrontIfUnfocused } from './bring_spotify_to_front_if_unfocused';
import type { SpotifySession } from './spotify_session';

vi.mock('../windows/is_process_in_foreground');
vi.mock('../windows/activate_process_window');

const BROWSER_PROCESS_ID = 4321;

function buildSession(isInForeground: boolean): SpotifySession {
	vi.mocked(isProcessInForeground).mockResolvedValue(isInForeground);
	const send = vi.fn(() =>
		Promise.resolve({
			processInfo: [{ type: 'browser', id: BROWSER_PROCESS_ID }],
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

describe('bringSpotifyToFrontIfUnfocused', () => {
	it('should check the foreground against the Spotify browser process', async () => {
		await bringSpotifyToFrontIfUnfocused(buildSession(true));

		expect(isProcessInForeground).toHaveBeenCalledWith(BROWSER_PROCESS_ID);
	});

	it('should leave the window alone when Spotify is in the foreground', async () => {
		vi.mocked(activateProcessWindow).mockClear();

		await bringSpotifyToFrontIfUnfocused(buildSession(true));

		expect(activateProcessWindow).not.toHaveBeenCalled();
	});

	it('should activate the Spotify window when it is not in the foreground', async () => {
		await bringSpotifyToFrontIfUnfocused(buildSession(false));

		expect(activateProcessWindow).toHaveBeenCalledWith(BROWSER_PROCESS_ID);
	});
});
