import { describe, expect, it } from 'vitest';

import { parseLyricsResponse } from './parse_lyrics_response';
import { SpotifyEvaluationError } from './spotify_evaluation_error';

function buildResponse(overrides: Record<string, unknown> = {}) {
	return {
		status: 200,
		syncType: 'LINE_SYNCED',
		lines: [
			{ startTimeMs: '3780', words: 'Te lo dije bien clarito' },
			{ startTimeMs: '50', words: '¿Qué horas son, mi corazón?' },
		],
		...overrides,
	};
}

describe('parseLyricsResponse', () => {
	it('should return the synced lines in the order they are sung, with numeric start times', () => {
		expect(parseLyricsResponse(buildResponse())).toEqual([
			{ startMilliseconds: 50, words: '¿Qué horas son, mi corazón?' },
			{ startMilliseconds: 3780, words: 'Te lo dije bien clarito' },
		]);
	});

	it('should return no line when Spotify has no lyrics for the track', () => {
		expect(
			parseLyricsResponse(
				buildResponse({ status: 404, syncType: null, lines: [] })
			)
		).toEqual([]);
	});

	it('should return no line for lyrics that are not synced line by line', () => {
		expect(
			parseLyricsResponse(buildResponse({ syncType: 'UNSYNCED' }))
		).toEqual([]);
	});

	it('should reject another HTTP status', () => {
		expect(() =>
			parseLyricsResponse(
				buildResponse({ status: 401, syncType: null, lines: [] })
			)
		).toThrow(SpotifyEvaluationError);
	});

	it('should reject a start time that is not a number', () => {
		expect(() =>
			parseLyricsResponse(
				buildResponse({ lines: [{ startTimeMs: 'soon', words: 'a' }] })
			)
		).toThrow(SpotifyEvaluationError);
	});
});
