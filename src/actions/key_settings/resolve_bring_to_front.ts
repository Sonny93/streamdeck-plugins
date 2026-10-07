import { bringToFrontSettingsSchema } from './bring_to_front_settings_schema';

/**
 * Resolves the "Bring Spotify to front" choice from a key's raw settings.
 * Missing or invalid settings fall back to the action's default.
 */
export function resolveBringToFront(
	options: Readonly<{ rawSettings: unknown; defaultValue: boolean }>
): boolean {
	const parsed = bringToFrontSettingsSchema.safeParse(options.rawSettings);
	if (!parsed.success) {
		return options.defaultValue;
	}
	return parsed.data.bringToFront ?? options.defaultValue;
}
