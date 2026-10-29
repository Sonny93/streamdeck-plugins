import { z } from 'zod';

const EVENT = 'listSpotifyDevices';
const requestSchema = z.object({
	event: z.literal(EVENT),
	isRefresh: z.boolean().optional(),
});

/**
 * The data source through which the "Play on device" property inspector asks for the Spotify Connect devices (sdpi-components `datasource` protocol).
 * Its refresh button sends the same request with `isRefresh`.
 */
export const SpotifyDevicesDataSource = {
	event: EVENT,
	readRequest: (
		payload: unknown
	): Readonly<{ isRefresh: boolean }> | undefined => {
		const parsed = requestSchema.safeParse(payload);
		return parsed.success
			? { isRefresh: parsed.data.isRefresh === true }
			: undefined;
	},
} as const;
