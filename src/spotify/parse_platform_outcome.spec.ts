import { describe, expect, it } from 'vitest';

import { parsePlatformOutcome } from './parse_platform_outcome';
import { SpotifyEvaluationError } from './spotify_evaluation_error';
import { SpotifyServiceNotFoundError } from './spotify_service_not_found_error';
import { SpotifyPlatformNotFoundError } from './spotify_platform_not_found_error';

function buildEvaluateResult(value: unknown): unknown {
	return { result: { type: 'object', value } };
}

function buildThrownResult(description: string): unknown {
	return {
		result: { type: 'object' },
		exceptionDetails: { text: 'Uncaught', exception: { description } },
	};
}

describe('parsePlatformOutcome', () => {
	it('should return the value produced by the script when the status is ok', () => {
		const rawResult = buildEvaluateResult({
			status: 'ok',
			value: { isPaused: true },
		});

		expect(parsePlatformOutcome(rawResult)).toEqual({ isPaused: true });
	});

	it('should return undefined when the script produced no value', () => {
		const rawResult = buildEvaluateResult({ status: 'ok' });

		expect(parsePlatformOutcome(rawResult)).toBeUndefined();
	});

	it('should throw a platform not found error when the platform is missing', () => {
		const rawResult = buildEvaluateResult({ status: 'platform-not-found' });

		expect(() => parsePlatformOutcome(rawResult)).toThrow(
			SpotifyPlatformNotFoundError
		);
	});

	it('should throw a service not found error when the service is missing', () => {
		const rawResult = buildEvaluateResult({
			status: 'service-not-found',
			service: 'PlayerAPI',
		});

		expect(() => parsePlatformOutcome(rawResult)).toThrow(
			SpotifyServiceNotFoundError
		);
	});

	it('should name the missing service in the service not found error', () => {
		const rawResult = buildEvaluateResult({
			status: 'service-not-found',
			service: 'PlayerAPI',
		});

		expect(() => parsePlatformOutcome(rawResult)).toThrow('"PlayerAPI"');
	});

	it('should throw an evaluation error when the status is unknown', () => {
		const rawResult = buildEvaluateResult({ status: 'mystery' });

		expect(() => parsePlatformOutcome(rawResult)).toThrow(
			SpotifyEvaluationError
		);
	});

	it('should throw an evaluation error when the service name is missing', () => {
		const rawResult = buildEvaluateResult({ status: 'service-not-found' });

		expect(() => parsePlatformOutcome(rawResult)).toThrow(
			SpotifyEvaluationError
		);
	});

	it('should throw an evaluation error when the value is not an envelope', () => {
		expect(() => parsePlatformOutcome(buildEvaluateResult(42))).toThrow(
			SpotifyEvaluationError
		);
	});

	it('should throw an evaluation error when the result has an unexpected shape', () => {
		expect(() => parsePlatformOutcome('nope')).toThrow(SpotifyEvaluationError);
	});

	it('should throw an evaluation error carrying the description when the script threw', () => {
		expect(() =>
			parsePlatformOutcome(buildThrownResult('TypeError: boom'))
		).toThrow('TypeError: boom');
	});
});
