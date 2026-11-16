import type { SpotifyHost } from '../platform/spotify_host';
import type { SpotifySession } from './spotify_session';

/** A command that also acts on the OS window or processes, so it receives the host next to the session; a `SpotifyCommand` fits too. */
export type SpotifyHostCommand = (
	session: SpotifySession,
	host: SpotifyHost
) => Promise<void>;
