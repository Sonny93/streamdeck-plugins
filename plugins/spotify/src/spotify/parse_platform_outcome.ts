import { z } from 'zod';

import { parseEvaluateResult } from './parse_evaluate_result';
import { SpotifyEvaluationError } from './spotify_evaluation_error';
import { SpotifyPlatformNotFoundError } from './spotify_platform_not_found_error';
import { SpotifyPlatformStatus } from './spotify_platform_status';
import { SpotifyServiceNotFoundError } from './spotify_service_not_found_error';

const platformOutcomeSchema = z.discriminatedUnion('status', [
	z.object({
		status: z.literal(SpotifyPlatformStatus.ok),
		value: z.unknown().optional(),
	}),
	z.object({ status: z.literal(SpotifyPlatformStatus.platformNotFound) }),
	z.object({
		status: z.literal(SpotifyPlatformStatus.serviceNotFound),
		service: z.string(),
	}),
]);

/**
 * Interprets the raw `Runtime.evaluate` result of the platform expression.
 * Returns the value produced by the script; throws a typed error when the platform or a service is missing.
 */
export function parsePlatformOutcome(rawResult: unknown): unknown {
	const parsed = platformOutcomeSchema.safeParse(
		parseEvaluateResult(rawResult)
	);
	if (!parsed.success) {
		throw new SpotifyEvaluationError({
			reason: 'the platform expression returned an unexpected value',
			cause: parsed.error,
		});
	}
	switch (parsed.data.status) {
		case SpotifyPlatformStatus.ok:
			return parsed.data.value;
		case SpotifyPlatformStatus.platformNotFound:
			throw new SpotifyPlatformNotFoundError();
		case SpotifyPlatformStatus.serviceNotFound:
			throw new SpotifyServiceNotFoundError({ service: parsed.data.service });
	}
}
