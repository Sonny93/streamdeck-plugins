import { z } from 'zod';

import { SpotifyTestIds } from './spotify_test_ids';
import { parseEvaluateResult } from './parse_evaluate_result';
import { SpotifyEvaluationError } from './spotify_evaluation_error';
import { SpotifyElementNotFoundError } from './spotify_element_not_found_error';
import { SpotifyFullscreenToggleOutcome } from './spotify_fullscreen_toggle_outcome';

const outcomeSchema = z.enum(SpotifyFullscreenToggleOutcome);

/**
 * Interprets the raw `Runtime.evaluate` result of the full screen toggle expression.
 * Both `changed` and `timeout` return normally; a missing button throws a typed error.
 */
export function parseFullscreenToggleOutcome(rawResult: unknown): void {
	const parsed = outcomeSchema.safeParse(parseEvaluateResult(rawResult));
	if (!parsed.success) {
		throw new SpotifyEvaluationError({
			reason: 'the full screen toggle expression returned an unexpected value',
			cause: parsed.error,
		});
	}
	if (parsed.data === SpotifyFullscreenToggleOutcome.notFound) {
		throw new SpotifyElementNotFoundError({
			testId: SpotifyTestIds.fullscreenModeButton,
		});
	}
}
