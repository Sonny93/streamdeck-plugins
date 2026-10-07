import { parseEvaluateResult } from './parse_evaluate_result';
import { SpotifyFocusOutcome } from './spotify_focus_outcome';
import { SpotifyEvaluationError } from './spotify_evaluation_error';
import { SpotifyElementNotFoundError } from './spotify_element_not_found_error';

/**
 * Interprets the raw `Runtime.evaluate` result of the focus expression.
 * Returns when the element was focused; throws a typed error otherwise.
 */
export function parseFocusOutcome(rawResult: unknown, testId: string): void {
	const value = parseEvaluateResult(rawResult);
	if (value === SpotifyFocusOutcome.focused) {
		return;
	}
	if (value === SpotifyFocusOutcome.notFound) {
		throw new SpotifyElementNotFoundError({ testId });
	}
	throw new SpotifyEvaluationError({
		reason: 'the focus expression returned an unexpected value',
	});
}
