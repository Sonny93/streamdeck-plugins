import { z } from 'zod';

import { SpotifyTestIds } from './spotify_test_ids';
import { parseEvaluateResult } from './parse_evaluate_result';
import { SpotifyEvaluationError } from './spotify_evaluation_error';
import { SpotifyCloseModalOutcome } from './spotify_close_modal_outcome';
import { SpotifyElementNotFoundError } from './spotify_element_not_found_error';

const outcomeSchema = z.enum(SpotifyCloseModalOutcome);

/**
 * Interprets the raw `Runtime.evaluate` result of the close search modal expression.
 * Returns when the modal was closed; throws a typed error otherwise.
 */
export function parseCloseSearchModalOutcome(rawResult: unknown): void {
	const parsed = outcomeSchema.safeParse(parseEvaluateResult(rawResult));
	if (!parsed.success) {
		throw new SpotifyEvaluationError({
			reason: 'the close modal expression returned an unexpected value',
			cause: parsed.error,
		});
	}
	if (parsed.data === SpotifyCloseModalOutcome.modalNotFound) {
		throw new SpotifyElementNotFoundError({
			testId: SpotifyTestIds.searchModalInput,
		});
	}
}
