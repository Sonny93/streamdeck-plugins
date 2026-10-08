import { ProfileFormat } from './profile_format.ts';
import type { ProfileLayout } from './profile_layout.ts';
import type { ProfileManifest } from './profile_manifest.ts';

/** Builds the profile `manifest.json`: an empty default page followed by the page that holds the actions. */
export function buildProfileManifest(
	options: Readonly<{ layout: ProfileLayout }>
): ProfileManifest {
	const { layout } = options;
	return {
		Device: { Model: ProfileFormat.deviceModel, UUID: '' },
		Name: layout.name,
		Pages: {
			Current: ProfileFormat.currentPageUuid,
			Default: layout.defaultPageUuid,
			Pages: [layout.contentPageUuid],
		},
		Version: ProfileFormat.profileVersion,
	};
}
