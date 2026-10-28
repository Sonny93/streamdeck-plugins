import { describe, expect, it } from 'vitest';

import { parseAddTrackOutcome } from './parse_add_track_outcome';
import { SpotifyEvaluationError } from './spotify_evaluation_error';
import { SpotifyNoCurrentTrackError } from './spotify_no_current_track_error';

describe('parseAddTrackOutcome', () => {
	it('should return when the track was added', () => {
		expect(() =>
			parseAddTrackOutcome({ outcome: 'added', trackUri: 'spotify:track:a' })
		).not.toThrow();
	});

	it('should return when the track was already present', () => {
		expect(() =>
			parseAddTrackOutcome({
				outcome: 'already-present',
				trackUri: 'spotify:track:a',
			})
		).not.toThrow();
	});

	it('should throw a no current track error when there is no track', () => {
		expect(() => parseAddTrackOutcome({ outcome: 'no-track' })).toThrow(
			SpotifyNoCurrentTrackError
		);
	});

	it('should throw an evaluation error when the outcome is unknown', () => {
		expect(() => parseAddTrackOutcome({ outcome: 'boom' })).toThrow(
			SpotifyEvaluationError
		);
	});

	it('should throw an evaluation error when the track uri is missing', () => {
		expect(() => parseAddTrackOutcome({ outcome: 'added' })).toThrow(
			SpotifyEvaluationError
		);
	});

	it('should throw an evaluation error when the script returned nothing', () => {
		expect(() => parseAddTrackOutcome(undefined)).toThrow(
			SpotifyEvaluationError
		);
	});
});
