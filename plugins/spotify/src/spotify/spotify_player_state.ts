import type { SpotifyPlayingTrack } from './spotify_playing_track';

/** What the plugin knows about Spotify playback: whether it is paused, which track is loaded and which Spotify Connect device plays, if any. */
export type SpotifyPlayerState = Readonly<{
	isPaused: boolean;
	trackUri: string | undefined;
	track: SpotifyPlayingTrack | undefined;
	activeDeviceId: string | undefined;
}>;
