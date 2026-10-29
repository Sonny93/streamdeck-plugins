import type { SpotifyDevice } from '../spotify/spotify_device';
import type { PlayOnDeviceSettings } from './play_on_device_settings';

/**
 * Copies the name and kind of the picked device into the settings of a "Play on device" key, from the devices Spotify listed,
 * so the key keeps drawing them while Spotify is closed. Returns `undefined` when nothing changes (no device picked, device not listed, same name and kind).
 */
export function rememberPickedDevice(
	options: Readonly<{
		settings: PlayOnDeviceSettings;
		devices: readonly SpotifyDevice[];
	}>
): PlayOnDeviceSettings | undefined {
	const { settings } = options;
	const device = options.devices.find(
		(candidate) => candidate.id === settings.deviceId
	);
	if (
		device === undefined ||
		(device.name === settings.deviceName && device.kind === settings.deviceKind)
	) {
		return undefined;
	}
	return { ...settings, deviceName: device.name, deviceKind: device.kind };
}
