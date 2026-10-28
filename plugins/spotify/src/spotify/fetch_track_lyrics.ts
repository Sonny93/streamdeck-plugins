import { fetchSpotifyLyrics } from './fetch_spotify_lyrics';
import { runSpotifyQuery } from './run_spotify_query';
import type { SpotifyLyricsLine } from './spotify_lyrics_line';

const TRACK_URI_PREFIX = 'spotify:track:';

/**
 * Fetches the synced lyrics of the item loaded in the player, from an already running Spotify.
 * Only tracks have lyrics: any other URI (an episode, an ad) gives no line without asking Spotify.
 */
export async function fetchTrackLyrics(
	trackUri: string
): Promise<SpotifyLyricsLine[]> {
	if (!trackUri.startsWith(TRACK_URI_PREFIX)) {
		return [];
	}
	const trackId = trackUri.slice(TRACK_URI_PREFIX.length);
	return runSpotifyQuery((session) => fetchSpotifyLyrics(session, trackId));
}
