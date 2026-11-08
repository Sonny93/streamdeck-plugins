import { ProfileActionUuids } from './profile_action_uuids.ts';

/** Names a variant file after the profile folder and the short names of its plugins: `spotify-deck--audio-display`. */
export function buildVariantName(
	options: Readonly<{ profileName: string; plugins: readonly string[] }>
): string {
	const shortNames = options.plugins.map((pluginUuid) =>
		pluginUuid.replace(ProfileActionUuids.personalPrefix, '')
	);
	return `${options.profileName}--${shortNames.join('-')}`;
}
