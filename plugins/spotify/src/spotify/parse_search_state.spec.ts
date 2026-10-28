import { describe, expect, it } from 'vitest';

import { parseSearchState } from './parse_search_state';
import { SpotifyEvaluationError } from './spotify_evaluation_error';

function buildEvaluateResult(value: unknown): unknown {
	return { result: { type: 'object', value } };
}

describe('parseSearchState', () => {
	it('should return the state when the page reports the modal input flag', () => {
		expect(
			parseSearchState(buildEvaluateResult({ hasModalInput: true }))
		).toEqual({ hasModalInput: true });
	});

	it('should throw an evaluation error when the flag is missing', () => {
		expect(() => parseSearchState(buildEvaluateResult({}))).toThrow(
			SpotifyEvaluationError
		);
	});

	it('should throw an evaluation error when the value is not an object', () => {
		expect(() => parseSearchState(buildEvaluateResult('nope'))).toThrow(
			SpotifyEvaluationError
		);
	});

	it('should throw an evaluation error carrying the description when the script threw', () => {
		const thrown = {
			result: { type: 'object' },
			exceptionDetails: {
				text: 'Uncaught',
				exception: { description: 'TypeError: boom' },
			},
		};

		expect(() => parseSearchState(thrown)).toThrow('TypeError: boom');
	});
});
