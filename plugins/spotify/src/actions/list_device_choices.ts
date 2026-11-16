import type { Language } from 'deck-kit/i18n/language';

import { spotifyMessages } from '../i18n/spotify_messages';
import type { SpotifyDevice } from '../spotify/spotify_device';
import type { PlayOnDeviceSettings } from './play_on_device_settings';

type DeviceChoice = Readonly<{ label: string; value: string }>;

/**
 * Lists the devices a "Play on device" key can be set to, for the property inspector, in the order of Spotify.
 * The device already picked stays listed while Spotify does not see it (switched off, out of reach), so the picker keeps showing it.
 */
export function listDeviceChoices(
	options: Readonly<{
		devices: readonly SpotifyDevice[];
		settings: PlayOnDeviceSettings;
		language: Language;
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
			label: spotifyMessages.text('deviceNotFound', options.language, {
				name:
					deviceName ?? spotifyMessages.text('pickedDevice', options.language),
			}),
			value: deviceId,
		},
		...choices,
	];
}
