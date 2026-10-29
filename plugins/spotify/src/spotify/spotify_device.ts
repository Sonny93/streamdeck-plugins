import type { SpotifyDeviceKind } from './spotify_device_kind';

/** A Spotify Connect device playback can be moved to: this computer, a phone, a TV, a speaker; `isActive` tells whether it plays right now. */
export type SpotifyDevice = Readonly<{
	id: string;
	name: string;
	kind: (typeof SpotifyDeviceKind)[keyof typeof SpotifyDeviceKind];
	isActive: boolean;
}>;
