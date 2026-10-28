import { describe, expect, it } from 'vitest';

import { parseClickOutcome } from './parse_click_outcome';
import { SpotifyEvaluationError } from './spotify_evaluation_error';
import { SpotifyElementNotFoundError } from './spotify_element_not_found_error';

const TEST_ID = 'lyrics-button';

function buildEvaluateResult(value: unknown): unknown {
	return { result: { type: 'string', value } };
}

function buildThrownResult(description: string): unknown {
	return {
		result: { type: 'object' },
		exceptionDetails: { text: 'Uncaught', exception: { description } },
	};
}

describe('parseClickOutcome', () => {
	it('should return when the element was clicked', () => {
		expect(() =>
			parseClickOutcome(buildEvaluateResult('clicked'), TEST_ID)
		).not.toThrow();
	});

	it('should throw an element not found error when the element is absent', () => {
		expect(() =>
			parseClickOutcome(buildEvaluateResult('not-found'), TEST_ID)
		).toThrow(SpotifyElementNotFoundError);
	});

	it('should throw an evaluation error carrying the description when the script threw', () => {
		expect(() =>
			parseClickOutcome(buildThrownResult('TypeError: boom'), TEST_ID)
		).toThrow('TypeError: boom');
	});

	it('should throw an evaluation error when the value is unexpected', () => {
		expect(() => parseClickOutcome(buildEvaluateResult(42), TEST_ID)).toThrow(
			SpotifyEvaluationError
		);
	});

	it('should throw an evaluation error when the result has an unexpected shape', () => {
		expect(() => parseClickOutcome('nope', TEST_ID)).toThrow(
			SpotifyEvaluationError
		);
	});
});
