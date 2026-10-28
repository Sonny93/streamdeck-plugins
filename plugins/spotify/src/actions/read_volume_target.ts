import type { VolumeTarget } from './volume_target';
import { volumeDialSettingsSchema } from './volume_dial_settings_schema';

/** Reads whose volume a dial controls from its raw settings; missing or invalid settings mean Spotify, and an empty app name means none picked. */
export function readVolumeTarget(rawSettings: unknown): VolumeTarget {
	const parsed = volumeDialSettingsSchema.safeParse(rawSettings);
	const settings = parsed.success ? parsed.data : {};
	switch (settings.target) {
		case 'focused':
			return { kind: 'focused' };
		case 'app': {
			const imageName = settings.appImageName?.trim();
			return {
				kind: 'app',
				imageName:
					imageName === undefined || imageName === '' ? undefined : imageName,
			};
		}
		case 'spotify':
		case undefined:
			return { kind: 'spotify' };
	}
}
