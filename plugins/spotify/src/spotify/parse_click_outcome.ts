import { parseEvaluateResult } from './parse_evaluate_result';
import { SpotifyClickOutcome } from './spotify_click_outcome';
import { SpotifyEvaluationError } from './spotify_evaluation_error';
import { SpotifyElementNotFoundError } from './spotify_element_not_found_error';

/**
 * Interprets the raw `Runtime.evaluate` result of the click expression.
 * Returns when the element was clicked; throws a typed error otherwise.
 */
export function parseClickOutcome(rawResult: unknown, testId: string): void {
	const value = parseEvaluateResult(rawResult);
	if (value === SpotifyClickOutcome.clicked) {
		return;
	}
	if (value === SpotifyClickOutcome.notFound) {
		throw new SpotifyElementNotFoundError({ testId });
	}
	throw new SpotifyEvaluationError({
		reason: 'the click expression returned an unexpected value',
	});
}
