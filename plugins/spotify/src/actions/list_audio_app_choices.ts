import type { AudioApp } from '../audio/audio_app';
import { formatAppDisplayName } from '../audio/format_app_display_name';
import { isSameImageName } from '../audio/is_same_image_name';

type AppChoice = Readonly<{ label: string; value: string }>;

/**
 * Lists the apps a "Volume" dial can be set to, for the property inspector: the apps playing sound right now,
 * plus the app already picked when it plays nothing at the moment, so the picker keeps showing it.
 */
export function listAudioAppChoices(
	options: Readonly<{
		apps: readonly AudioApp[];
		pickedImageName: string | undefined;
	}>
): AppChoice[] {
	const choices = options.apps.map((app) => ({
		label: app.displayName,
		value: app.imageName,
	}));
	const picked = options.pickedImageName;
	if (
		picked === undefined ||
		picked === '' ||
		choices.some((choice) => isSameImageName(choice.value, picked))
	) {
		return choices;
	}
	return [{ label: formatAppDisplayName(picked), value: picked }, ...choices];
}
