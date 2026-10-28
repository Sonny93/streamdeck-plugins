import { z } from 'zod';

import type { SpotifyLyricsLine } from './spotify_lyrics_line';
import { SpotifyEvaluationError } from './spotify_evaluation_error';

const HTTP_OK = 200;
const HTTP_NOT_FOUND = 404;
const LINE_SYNCED = 'LINE_SYNCED';

const lyricsResponseSchema = z.object({
	status: z.number(),
	syncType: z.string().nullable(),
	lines: z.array(
		z.object({
			startTimeMs: z.coerce.number().pipe(z.number().finite().nonnegative()),
			words: z.string(),
		})
	),
});

/**
 * Interprets the value produced by the lyrics script: the lines in the order they are sung when Spotify has lyrics synced line by line,
 * and no line when it has no lyrics for the track (HTTP 404) or only unsynced ones. Any other HTTP status is an error.
 */
export function parseLyricsResponse(rawResponse: unknown): SpotifyLyricsLine[] {
	const parsed = lyricsResponseSchema.safeParse(rawResponse);
	if (!parsed.success) {
		throw new SpotifyEvaluationError({
			reason: 'the lyrics response has an unexpected shape',
			cause: parsed.error,
		});
	}
	const { status, syncType, lines } = parsed.data;
	if (status === HTTP_NOT_FOUND) {
		return [];
	}
	if (status !== HTTP_OK) {
		throw new SpotifyEvaluationError({
			reason: `the lyrics request answered HTTP ${status}`,
		});
	}
	if (syncType !== LINE_SYNCED) {
		return [];
	}
	return lines
		.map((line) => ({ startMilliseconds: line.startTimeMs, words: line.words }))
		.toSorted(
			(first, second) => first.startMilliseconds - second.startMilliseconds
		);
}
