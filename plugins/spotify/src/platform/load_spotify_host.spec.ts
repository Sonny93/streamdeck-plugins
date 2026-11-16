import { describe, expect, it } from 'vitest';

import { loadSpotifyHost } from './load_spotify_host';
import { UnsupportedPlatformError } from './unsupported_platform_error';

describe('loadSpotifyHost', () => {
	it('should load the Linux host on linux', async () => {
		const host = await loadSpotifyHost('linux');

		expect(host.spotifyImageName).toBe('spotify');
	});

	it('should load the Windows host on win32', async () => {
		const host = await loadSpotifyHost('win32');

		expect(host.spotifyImageName).toBe('Spotify.exe');
	});

	it('should fail with a typed error on another platform', async () => {
		await expect(loadSpotifyHost('darwin')).rejects.toBeInstanceOf(
			UnsupportedPlatformError
		);
	});
});
