import type { SpotifyDevice } from '../spotify/spotify_device';
import { SpotifyDeviceKind } from '../spotify/spotify_device_kind';
import type { PlayOnDeviceSettings } from './play_on_device_settings';

const NO_DEVICE_LABEL = 'No device';
const UNNAMED_DEVICE_LABEL = 'Device';

/**
 * Decides how a "Play on device" key looks: the label typed in its settings, else the device name, under the icon of the device kind;
 * lit while the picked device plays.
 */
export function resolveDeviceKey(
	options: Readonly<{
		settings: PlayOnDeviceSettings;
		activeDeviceId: string | undefined;
	}>
): Readonly<{ kind: SpotifyDevice['kind']; label: string; isActive: boolean }> {
	const { deviceId, deviceName, deviceKind, label } = options.settings;
	const hasDevice = deviceId !== undefined && deviceId !== '';
	const typedLabel = label?.trim() ?? '';
	const fallbackLabel = hasDevice
		? (deviceName ?? UNNAMED_DEVICE_LABEL)
		: NO_DEVICE_LABEL;
	return {
		kind: deviceKind ?? SpotifyDeviceKind.speaker,
		label: typedLabel === '' ? fallbackLabel : typedLabel,
		isActive: hasDevice && deviceId === options.activeDeviceId,
	};
}
