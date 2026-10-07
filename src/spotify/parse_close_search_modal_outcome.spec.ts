import { describe, expect, it } from 'vitest';

import { SpotifyEvaluationError } from './spotify_evaluation_error';
import { SpotifyElementNotFoundError } from './spotify_element_not_found_error';
import { parseCloseSearchModalOutcome } from './parse_close_search_modal_outcome';

function buildEvaluateResult(value: unknown): unknown {
	return { result: { type: 'string', value } };
}

describe('parseCloseSearchModalOutcome', () => {
	it('should return when the modal was closed', () => {
		expect(() =>
			parseCloseSearchModalOutcome(buildEvaluateResult('closed'))
		).not.toThrow();
	});

	it('should throw an element not found error when the modal is absent', () => {
		expect(() =>
			parseCloseSearchModalOutcome(buildEvaluateResult('modal-not-found'))
		).toThrow(SpotifyElementNotFoundError);
	});

	it('should throw an evaluation error when the value is unexpected', () => {
		expect(() => parseCloseSearchModalOutcome(buildEvaluateResult(42))).toThrow(
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

		expect(() => parseCloseSearchModalOutcome(thrown)).toThrow(
			'TypeError: boom'
		);
	});
});
