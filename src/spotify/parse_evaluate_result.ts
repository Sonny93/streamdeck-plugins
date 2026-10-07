import { z } from 'zod';

import { SpotifyEvaluationError } from './spotify_evaluation_error';

const evaluateResultSchema = z.object({
	result: z.object({ value: z.unknown().optional() }),
	exceptionDetails: z
		.object({
			text: z.string(),
			exception: z.object({ description: z.string().optional() }).optional(),
		})
		.optional(),
});

/**
 * Validates a raw `Runtime.evaluate` result and returns the evaluated value.
 * Throws a typed error when the script threw or the result has an unexpected shape.
 */
export function parseEvaluateResult(rawResult: unknown): unknown {
	const parsed = evaluateResultSchema.safeParse(rawResult);
	if (!parsed.success) {
		throw new SpotifyEvaluationError({
			reason: 'unexpected evaluate result',
			cause: parsed.error,
		});
	}
	const { result, exceptionDetails } = parsed.data;
	if (exceptionDetails !== undefined) {
		throw new SpotifyEvaluationError({
			reason: exceptionDetails.exception?.description ?? exceptionDetails.text,
		});
	}
	return result.value;
}
