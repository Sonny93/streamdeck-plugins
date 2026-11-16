import { vi } from 'vitest';

import type { SpotifyHost } from './spotify_host';

/** Test helper: builds a host whose every operation is a mock that resolves, with `overrides` replacing some of them. */
export function buildFakeSpotifyHost(
	overrides: Partial<SpotifyHost> = {}
): SpotifyHost {
	return {
		spotifyImageName: 'Spotify.exe',
		launchSpotify: vi.fn(() => Promise.resolve()),
		isSpotifyRunning: vi.fn(() => Promise.resolve(false)),
		killSpotify: vi.fn(() => Promise.resolve()),
		isWindowInForeground: vi.fn(() => Promise.resolve(false)),
		activateWindow: vi.fn(() => Promise.resolve()),
		stopWindowFlashing: vi.fn(() => Promise.resolve()),
		audioMixer: {
			listApps: vi.fn(() => Promise.resolve([])),
			updateApp: vi.fn(() => Promise.resolve(true)),
			readForegroundApp: vi.fn(() => Promise.resolve(undefined)),
		},
		encodeFrame: vi.fn((svg: string) => Promise.resolve(svg)),
		prepareCover: vi.fn((coverDataUrl: string) =>
			Promise.resolve(coverDataUrl)
		),
		...overrides,
	};
}
