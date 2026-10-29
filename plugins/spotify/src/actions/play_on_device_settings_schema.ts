import { z } from 'zod';

import { SpotifyDeviceKind } from '../spotify/spotify_device_kind';

/**
 * Per-key settings of a "Play on device" key: the device picked in its property inspector, its name and kind as last seen
 * (so the key still draws them while Spotify is closed), and an optional label typed over the name; unknown keys are ignored.
 */
export const playOnDeviceSettingsSchema = z.object({
	deviceId: z.string().optional(),
	deviceName: z.string().optional(),
	deviceKind: z.enum(Object.values(SpotifyDeviceKind)).optional(),
	label: z.string().optional(),
});
