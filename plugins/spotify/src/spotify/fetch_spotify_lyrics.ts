import { parseLyricsResponse } from './parse_lyrics_response';
import { runPlatformScript } from './run_platform_script';
import type { SpotifyLyricsLine } from './spotify_lyrics_line';
import type { SpotifySession } from './spotify_session';

const LYRICS_URL_PREFIX =
	'https://spclient.wg.spotify.com/color-lyrics/v2/track/';
const LYRICS_URL_QUERY = '?format=json&vocalRemoval=false&market=from_token';
const HTTP_OK = 200;

function buildFetchLyricsBody(trackId: string): string {
	const url = `${LYRICS_URL_PREFIX}${encodeURIComponent(trackId)}${LYRICS_URL_QUERY}`;
	return `
		const okStatus = ${JSON.stringify(HTTP_OK)};
		const response = await platform.getTransport().request(${JSON.stringify(url)}, {
			method: 'GET',
			headers: { 'app-platform': 'WebPlayer' },
			responseType: 'json',
			authorize: true,
		});
		if (response.status !== okStatus) {
			return { status: response.status, syncType: null, lines: [] };
		}
		const body = typeof response.body === 'string' ? JSON.parse(response.body) : response.body;
		const lyrics = body?.lyrics;
		return {
			status: response.status,
			syncType: lyrics?.syncType ?? null,
			lines: (lyrics?.lines ?? []).map((line) => ({ startTimeMs: line.startTimeMs, words: line.words ?? '' })),
		};
	`;
}

/**
 * Asks Spotify, through its own authenticated transport, for the synced lyrics of a track (its id, not its URI).
 * Returns no line when Spotify has no lyrics for it, or only lyrics that are not synced line by line.
 */
export async function fetchSpotifyLyrics(
	session: SpotifySession,
	trackId: string
): Promise<SpotifyLyricsLine[]> {
	return parseLyricsResponse(
		await runPlatformScript(session, buildFetchLyricsBody(trackId))
	);
}
