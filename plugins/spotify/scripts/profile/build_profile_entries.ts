import { buildBackToParentAction } from './build_back_to_parent_action.ts';
import { buildDirectoryEntry } from './build_directory_entry.ts';
import { buildJsonEntry } from './build_json_entry.ts';
import { buildOpenFolderAction } from './build_open_folder_action.ts';
import { buildPageEntries } from './build_page_entries.ts';
import { buildPageManifest } from './build_page_manifest.ts';
import { buildProfileManifest } from './build_profile_manifest.ts';
import { buildProfilePackageJson } from './build_profile_package_json.ts';
import { BuiltInActions } from './built_in_actions.ts';
import type { PluginManifest } from './plugin_manifest.ts';
import type { ProfileFolder } from './profile_folder.ts';
import { ProfileFormat } from './profile_format.ts';
import type { ProfileLayout } from './profile_layout.ts';
import type { ZipEntry } from './zip_entry.ts';

function buildFolderEntries(
	options: Readonly<{
		folder: ProfileFolder;
		pagesDirectory: string;
		manifest: PluginManifest;
	}>
): ZipEntry[] {
	const { folder, pagesDirectory, manifest } = options;
	const { backToParent } = BuiltInActions;
	return buildPageEntries({
		directory: `${pagesDirectory}/${folder.pageUuid.toUpperCase()}`,
		page: buildPageManifest({
			keys: folder.keys,
			builtInKeys: [
				{
					column: backToParent.column,
					row: backToParent.row,
					action: buildBackToParentAction(folder.backActionId),
				},
			],
			encoders: folder.encoders,
			manifest,
		}),
	});
}

/**
 * Builds every entry of the `.streamDeckProfile` archive: the root package, the profile manifest, the empty default page,
 * the page that holds the actions, then one page per folder (folder pages are not listed in the profile manifest).
 */
export function buildProfileEntries(
	options: Readonly<{ layout: ProfileLayout; manifest: PluginManifest }>
): ZipEntry[] {
	const { layout, manifest } = options;
	const profileDirectory = `${ProfileFormat.profilesDirectory}/${layout.profileUuid.toUpperCase()}${ProfileFormat.profileDirectorySuffix}`;
	const pagesDirectory = `${profileDirectory}/${ProfileFormat.profilesDirectory}`;
	return [
		buildJsonEntry({
			name: ProfileFormat.packageFile,
			value: buildProfilePackageJson({ pluginUuid: manifest.uuid }),
		}),
		buildDirectoryEntry({ path: ProfileFormat.profilesDirectory }),
		buildDirectoryEntry({ path: profileDirectory }),
		buildJsonEntry({
			name: `${profileDirectory}/${ProfileFormat.manifestFile}`,
			value: buildProfileManifest({ layout }),
		}),
		buildDirectoryEntry({ path: pagesDirectory }),
		...buildPageEntries({
			directory: `${pagesDirectory}/${layout.defaultPageUuid.toUpperCase()}`,
			page: buildPageManifest({ keys: [], encoders: [], manifest }),
		}),
		...buildPageEntries({
			directory: `${pagesDirectory}/${layout.contentPageUuid.toUpperCase()}`,
			page: buildPageManifest({
				keys: layout.keys,
				builtInKeys: layout.folders.map((folder) => ({
					column: folder.column,
					row: folder.row,
					action: buildOpenFolderAction(folder),
				})),
				encoders: layout.encoders,
				manifest,
			}),
		}),
		...layout.folders.flatMap((folder) =>
			buildFolderEntries({ folder, pagesDirectory, manifest })
		),
	];
}
