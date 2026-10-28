import { buildDirectoryEntry } from './build_directory_entry.ts';
import { buildJsonEntry } from './build_json_entry.ts';
import type { PageManifest } from './page_manifest.ts';
import { ProfileFormat } from './profile_format.ts';
import type { ZipEntry } from './zip_entry.ts';

/** Builds the entries of one page: its directory, its empty Images directory and its `manifest.json`. */
export function buildPageEntries(
	options: Readonly<{ directory: string; page: PageManifest }>
): ZipEntry[] {
	const { directory, page } = options;
	return [
		buildDirectoryEntry({ path: directory }),
		buildDirectoryEntry({
			path: `${directory}/${ProfileFormat.imagesDirectory}`,
		}),
		buildJsonEntry({
			name: `${directory}/${ProfileFormat.manifestFile}`,
			value: page,
		}),
	];
}
