import { z } from 'zod';

import { parseEvaluateResult } from './parse_evaluate_result';
import { SpotifyEvaluationError } from './spotify_evaluation_error';
import type { SpotifySearchState } from './spotify_search_state';

const searchStateSchema = z.object({ hasModalInput: z.boolean() });

/** Validates the raw `Runtime.evaluate` result of the search state expression. */
export function parseSearchState(rawResult: unknown): SpotifySearchState {
	const parsed = searchStateSchema.safeParse(parseEvaluateResult(rawResult));
	if (!parsed.success) {
		throw new SpotifyEvaluationError({
			reason: 'unexpected search state',
			cause: parsed.error,
		});
	}
	return parsed.data;
}
