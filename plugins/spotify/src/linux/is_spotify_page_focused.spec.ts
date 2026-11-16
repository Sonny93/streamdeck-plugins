import { describe, expect, it, vi } from 'vitest';

import type { SpotifySession } from '../spotify/spotify_session';
import { isSpotifyPageFocused } from './is_spotify_page_focused';

function buildSession(value: boolean): SpotifySession {
	const send = vi.fn(() => Promise.resolve({ result: { value } }));
	const connection = { send, close: vi.fn() };
	return {
		browser: connection,
		page: connection,
		pageTargetId: 'target-1',
		launchedByPlugin: false,
	};
}

describe('isSpotifyPageFocused', () => {
	it('should be true when the page has the focus', async () => {
		expect(await isSpotifyPageFocused(buildSession(true))).toBe(true);
	});

	it('should be false when the page lacks the focus', async () => {
		expect(await isSpotifyPageFocused(buildSession(false))).toBe(false);
	});
});
