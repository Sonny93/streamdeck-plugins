import { z } from 'zod';

import { SpotifyEvaluationError } from './spotify_evaluation_error';
import { SpotifyAddTrackOutcome } from './spotify_add_track_outcome';
import { SpotifyNoCurrentTrackError } from './spotify_no_current_track_error';

const addTrackOutcomeSchema = z.discriminatedUnion('outcome', [
	z.object({
		outcome: z.literal(SpotifyAddTrackOutcome.added),
		trackUri: z.string(),
	}),
	z.object({
		outcome: z.literal(SpotifyAddTrackOutcome.alreadyPresent),
		trackUri: z.string(),
	}),
	z.object({ outcome: z.literal(SpotifyAddTrackOutcome.noTrack) }),
]);

/**
 * Interprets the value produced by the add-track script.
 * Returns when the track was added or was already there; throws a typed error when Spotify has no current track.
 */
export function parseAddTrackOutcome(rawOutcome: unknown): void {
	const parsed = addTrackOutcomeSchema.safeParse(rawOutcome);
	if (!parsed.success) {
		throw new SpotifyEvaluationError({
			reason: 'the add-track script returned an unexpected value',
			cause: parsed.error,
		});
	}
	if (parsed.data.outcome === SpotifyAddTrackOutcome.noTrack) {
		throw new SpotifyNoCurrentTrackError();
	}
}
