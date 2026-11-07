import { buildDirectoryEntry } from 'deck-kit/zip/build_directory_entry';
import type { ZipEntry } from 'deck-kit/zip/zip_entry';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

import { compareCodeUnits } from './compare_code_units.ts';

/**
 * Turns the content of a directory into zip entries with that content at the archive root, sorted by name,
 * so the same folder content always gives the same archive.
 */
export async function buildDirectoryContentsZipEntries(
	options: Readonly<{ directory: string }>
): Promise<ZipEntry[]> {
	const { directory } = options;
	const children = await readdir(directory, {
		recursive: true,
		withFileTypes: true,
	});
	const entries = await Promise.all(
		children.map(async (child): Promise<ZipEntry> => {
			const absolutePath = path.join(child.parentPath, child.name);
			const archivePath = path
				.relative(directory, absolutePath)
				.split(path.sep)
				.join('/');
			return child.isDirectory()
				? buildDirectoryEntry({ path: archivePath })
				: { name: archivePath, data: await readFile(absolutePath) };
		})
	);
	return entries.sort((first, second) =>
		compareCodeUnits(first.name, second.name)
	);
}
