import type { ZipEntry } from './zip_entry.ts';
import { ProfileFormat } from './profile_format.ts';
import { buildJsonEntry } from './build_json_entry.ts';
import type { ProfileLayout } from './profile_layout.ts';
import { buildPageEntries } from './build_page_entries.ts';
import type { PluginManifest } from './plugin_manifest.ts';
import { buildPageManifest } from './build_page_manifest.ts';
import { buildDirectoryEntry } from './build_directory_entry.ts';
import { buildProfileManifest } from './build_profile_manifest.ts';
import { buildProfilePackageJson } from './build_profile_package_json.ts';

/** Builds every entry of the `.streamDeckProfile` archive: the root package, the profile manifest, the empty default page and the page that holds the actions. */
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
				encoders: layout.encoders,
				manifest,
			}),
		}),
	];
}
