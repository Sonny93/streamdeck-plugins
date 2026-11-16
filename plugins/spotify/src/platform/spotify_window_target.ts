import type { SpotifySession } from '../spotify/spotify_session';

/** What a platform needs to tell whether Spotify's window is the one in the foreground: its browser process and the open CDP session. */
export type SpotifyWindowTarget = Readonly<{
	processId: number;
	session: SpotifySession;
}>;
