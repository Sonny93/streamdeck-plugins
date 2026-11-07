import { buildDirectoryEntry } from 'deck-kit/zip/build_directory_entry';
import type { ZipEntry } from 'deck-kit/zip/zip_entry';

import { compareCodeUnits } from './compare_code_units.ts';

const PROFILE_FOLDER = /^Profiles\/[^/]+\.sdProfile$/u;
const PAGE_FOLDER = /^Profiles\/[^/]+\.sdProfile\/Profiles\/[^/]+$/u;
const IMAGES_FOLDER = 'Images';

function isImageHolder(options: Readonly<{ entry: ZipEntry }>): boolean {
	const { name } = options.entry;
	if (!name.endsWith('/')) {
		return false;
	}
	const folder = name.slice(0, -1);
	return PROFILE_FOLDER.test(folder) || PAGE_FOLDER.test(folder);
}

/**
 * Adds an empty `Images/` directory entry to the `.sdProfile` folder and to every page folder that lacks one.
 * Git drops empty folders, but exported archives have them and Stream Deck expects them.
 */
export function addProfileImageDirectories(
	options: Readonly<{ entries: readonly ZipEntry[] }>
): ZipEntry[] {
	const names = new Set(options.entries.map((entry) => entry.name));
	const missing = options.entries
		.filter((entry) => isImageHolder({ entry }))
		.map((entry) =>
			buildDirectoryEntry({ path: `${entry.name}${IMAGES_FOLDER}` })
		)
		.filter((entry) => !names.has(entry.name));
	return [...options.entries, ...missing].sort((first, second) =>
		compareCodeUnits(first.name, second.name)
	);
}
