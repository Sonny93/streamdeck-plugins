import { z } from 'zod';

import type { SpotifyDevice } from './spotify_device';
import { SpotifyDeviceKind } from './spotify_device_kind';
import { SpotifyEvaluationError } from './spotify_evaluation_error';

/** Spotify Connect device types grouped by the icon they get; the types missing here are drawn as a speaker. */
const KINDS_BY_TYPE: Readonly<Record<string, SpotifyDevice['kind']>> = {
	computer: SpotifyDeviceKind.computer,
	chromebook: SpotifyDeviceKind.computer,
	smartphone: SpotifyDeviceKind.phone,
	tablet: SpotifyDeviceKind.phone,
	smartwatch: SpotifyDeviceKind.phone,
	tv: SpotifyDeviceKind.tv,
	cast_video: SpotifyDeviceKind.tv,
	stb: SpotifyDeviceKind.tv,
	game_console: SpotifyDeviceKind.tv,
};

const deviceListingSchema = z.object({
	devices: z.array(
		z.object({
			id: z.string(),
			name: z.string(),
			type: z.string(),
			isActive: z.boolean(),
		})
	),
});

/** Interprets the value produced by the device listing script, keeping Spotify's order. */
export function parseDeviceListing(rawListing: unknown): SpotifyDevice[] {
	const parsed = deviceListingSchema.safeParse(rawListing);
	if (!parsed.success) {
		throw new SpotifyEvaluationError({
			reason: 'the device listing has an unexpected shape',
			cause: parsed.error,
		});
	}
	return parsed.data.devices.map((device) => ({
		id: device.id,
		name: device.name,
		kind: KINDS_BY_TYPE[device.type.toLowerCase()] ?? SpotifyDeviceKind.speaker,
		isActive: device.isActive,
	}));
}
