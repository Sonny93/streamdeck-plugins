import { describe, expect, it } from 'vitest';

import { findSpotifyPageTarget } from './find_spotify_page_target';
import type { SpotifyTarget } from './spotify_target';

function buildTarget(overrides: Partial<SpotifyTarget> = {}): SpotifyTarget {
	return {
		id: 'target-1',
		type: 'page',
		url: 'https://xpui.app.spotify.com/index.html',
		webSocketDebuggerUrl: 'ws://127.0.0.1:9229/devtools/page/target-1',
		...overrides,
	};
}

describe('findSpotifyPageTarget', () => {
	it('should return the Spotify page when it is listed', () => {
		expect(findSpotifyPageTarget([buildTarget()])).toEqual({
			id: 'target-1',
			webSocketDebuggerUrl: 'ws://127.0.0.1:9229/devtools/page/target-1',
		});
	});

	it('should ignore browser UI targets when a Spotify page is also listed', () => {
		const browserUi = buildTarget({
			id: 'omnibox',
			type: 'browser_ui',
			url: 'chrome://omnibox-popup',
		});

		expect(
			findSpotifyPageTarget([browserUi, buildTarget({ id: 'spotify' })])?.id
		).toBe('spotify');
	});

	it('should ignore pages that are not served by the Spotify UI host', () => {
		expect(
			findSpotifyPageTarget([buildTarget({ url: 'https://example.com/' })])
		).toBeUndefined();
	});

	it('should ignore targets without a websocket debugger url', () => {
		expect(
			findSpotifyPageTarget([buildTarget({ webSocketDebuggerUrl: undefined })])
		).toBeUndefined();
	});

	it('should return undefined when no target is listed', () => {
		expect(findSpotifyPageTarget([])).toBeUndefined();
	});
});
