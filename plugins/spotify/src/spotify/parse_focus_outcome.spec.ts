import { describe, expect, it } from 'vitest';

import { parseFocusOutcome } from './parse_focus_outcome';
import { SpotifyElementNotFoundError } from './spotify_element_not_found_error';
import { SpotifyEvaluationError } from './spotify_evaluation_error';

const TEST_ID = 'search-modal-input';

function buildEvaluateResult(value: unknown): unknown {
	return { result: { type: 'string', value } };
}

describe('parseFocusOutcome', () => {
	it('should return when the element was focused', () => {
		expect(() =>
			parseFocusOutcome(buildEvaluateResult('focused'), TEST_ID)
		).not.toThrow();
	});

	it('should throw an element not found error when the element is absent', () => {
		expect(() =>
			parseFocusOutcome(buildEvaluateResult('not-found'), TEST_ID)
		).toThrow(SpotifyElementNotFoundError);
	});

	it('should throw an evaluation error when the value is unexpected', () => {
		expect(() => parseFocusOutcome(buildEvaluateResult(42), TEST_ID)).toThrow(
			SpotifyEvaluationError
		);
	});
});
