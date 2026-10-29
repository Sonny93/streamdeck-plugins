import type { SpotifyDevice } from '../spotify/spotify_device';
import type { PlayOnDeviceSettings } from './play_on_device_settings';

type DeviceChoice = Readonly<{ label: string; value: string }>;

const UNKNOWN_DEVICE_NAME = 'Picked device';
const MISSING_SUFFIX = ' (not found)';

/**
 * Lists the devices a "Play on device" key can be set to, for the property inspector, in the order of Spotify.
 * The device already picked stays listed while Spotify does not see it (switched off, out of reach), so the picker keeps showing it.
 */
export function listDeviceChoices(
	options: Readonly<{
		devices: readonly SpotifyDevice[];
		settings: PlayOnDeviceSettings;
	}>
): DeviceChoice[] {
	const choices = options.devices.map((device) => ({
		label: device.name,
		value: device.id,
	}));
	const { deviceId, deviceName } = options.settings;
	if (
		deviceId === undefined ||
		deviceId === '' ||
		choices.some((choice) => choice.value === deviceId)
	) {
		return choices;
	}
	return [
		{
			label: `${deviceName ?? UNKNOWN_DEVICE_NAME}${MISSING_SUFFIX}`,
			value: deviceId,
		},
		...choices,
	];
}
