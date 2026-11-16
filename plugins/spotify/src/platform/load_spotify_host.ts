import type { SpotifyHost } from './spotify_host';
import { UnsupportedPlatformError } from './unsupported_platform_error';

/**
 * Loads the host of the running OS.
 * Each host is imported on demand, so Windows' native FFI code never loads on Linux and the other way round.
 */
export async function loadSpotifyHost(
	platform: NodeJS.Platform = process.platform
): Promise<SpotifyHost> {
	if (platform === 'win32') {
		return (await import('./windows')).windowsSpotifyHost;
	}
	if (platform === 'linux') {
		return (await import('./linux')).linuxSpotifyHost;
	}
	throw new UnsupportedPlatformError({ platform });
}
