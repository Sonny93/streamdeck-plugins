import { describe, expect, it, vi } from 'vitest';

import { buildFakeSpotifyHost } from '../platform/build_fake_spotify_host';
import { bringSpotifyToFrontIfUnfocused } from './bring_spotify_to_front_if_unfocused';
import type { SpotifySession } from './spotify_session';

const BROWSER_PROCESS_ID = 4321;

function buildSession(): SpotifySession {
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

function buildHost(isInForeground: boolean) {
	return buildFakeSpotifyHost({
		isWindowInForeground: vi.fn(() => Promise.resolve(isInForeground)),
	});
}

describe('bringSpotifyToFrontIfUnfocused', () => {
	it('should check the foreground against the Spotify browser process and session', async () => {
		const host = buildHost(true);
		const session = buildSession();

		await bringSpotifyToFrontIfUnfocused(session, host);

		expect(host.isWindowInForeground).toHaveBeenCalledWith({
			processId: BROWSER_PROCESS_ID,
			session,
		});
	});

	it('should leave the window alone when Spotify is in the foreground', async () => {
		const host = buildHost(true);

		await bringSpotifyToFrontIfUnfocused(buildSession(), host);

		expect(host.activateWindow).not.toHaveBeenCalled();
	});

	it('should activate the Spotify window when it is not in the foreground', async () => {
		const host = buildHost(false);

		await bringSpotifyToFrontIfUnfocused(buildSession(), host);

		expect(host.activateWindow).toHaveBeenCalledWith(BROWSER_PROCESS_ID);
	});
});
