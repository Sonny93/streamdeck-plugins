/** Raised when playback is moved to a Spotify Connect device that Spotify does not list right now (switched off, signed out, out of reach). */
export class SpotifyDeviceNotFoundError extends Error {
	readonly code = 'E_SPOTIFY_DEVICE_NOT_FOUND';
	override readonly name = 'SpotifyDeviceNotFoundError';

	constructor(options: Readonly<{ deviceId: string }>) {
		super(`Spotify does not list the device "${options.deviceId}".`);
	}
}
