import type { SpotifySession } from './spotify_session';

/** An operation performed on Spotify through an open session. */
export type SpotifyCommand = (session: SpotifySession) => Promise<void>;
