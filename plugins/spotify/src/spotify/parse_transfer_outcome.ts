import { z } from 'zod';

import { SpotifyDeviceNotFoundError } from './spotify_device_not_found_error';
import { SpotifyEvaluationError } from './spotify_evaluation_error';
import { SpotifyTransferOutcome } from './spotify_transfer_outcome';

const transferOutcomeSchema = z.object({
	outcome: z.enum([
		SpotifyTransferOutcome.transferred,
		SpotifyTransferOutcome.alreadyActive,
		SpotifyTransferOutcome.deviceNotFound,
	]),
});

/**
 * Interprets the value produced by the transfer script.
 * Returns when playback moved or already played on the device; throws a typed error when Spotify does not list the device.
 */
export function parseTransferOutcome(
	rawOutcome: unknown,
	deviceId: string
): void {
	const parsed = transferOutcomeSchema.safeParse(rawOutcome);
	if (!parsed.success) {
		throw new SpotifyEvaluationError({
			reason: 'the transfer script returned an unexpected value',
			cause: parsed.error,
		});
	}
	if (parsed.data.outcome === SpotifyTransferOutcome.deviceNotFound) {
		throw new SpotifyDeviceNotFoundError({ deviceId });
	}
}
