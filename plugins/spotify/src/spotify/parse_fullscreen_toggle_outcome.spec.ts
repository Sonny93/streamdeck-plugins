import { describe, expect, it } from 'vitest';

import { parseFullscreenToggleOutcome } from './parse_fullscreen_toggle_outcome';
import { SpotifyElementNotFoundError } from './spotify_element_not_found_error';
import { SpotifyEvaluationError } from './spotify_evaluation_error';

function buildEvaluateResult(value: unknown): unknown {
	return { result: { type: 'string', value } };
}

describe('parseFullscreenToggleOutcome', () => {
	it('should return when the full screen state changed', () => {
		expect(() =>
			parseFullscreenToggleOutcome(buildEvaluateResult('changed'))
		).not.toThrow();
	});

	it('should return when waiting for the change timed out', () => {
		expect(() =>
			parseFullscreenToggleOutcome(buildEvaluateResult('timeout'))
		).not.toThrow();
	});

	it('should throw an element not found error when the button is absent', () => {
		expect(() =>
			parseFullscreenToggleOutcome(buildEvaluateResult('not-found'))
		).toThrow(SpotifyElementNotFoundError);
	});

	it('should throw an evaluation error when the value is unexpected', () => {
		expect(() => parseFullscreenToggleOutcome(buildEvaluateResult(42))).toThrow(
			SpotifyEvaluationError
		);
	});
});
