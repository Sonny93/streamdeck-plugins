import { connectToRunningSpotify } from './connect_to_running_spotify';
import type { SpotifySession } from './spotify_session';
import { useSpotifySession } from './use_spotify_session';

/**
 * Connects to an already running Spotify, runs the read-only query, and always closes the CDP connections afterwards.
 * Never launches Spotify: rejects with `SpotifyNotReachableError` when it is closed.
 */
export async function runSpotifyQuery<TResult>(
	query: (session: SpotifySession) => Promise<TResult>
): Promise<TResult> {
	return useSpotifySession(await connectToRunningSpotify(), query);
}
