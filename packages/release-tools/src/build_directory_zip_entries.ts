import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

import { compareCodeUnits } from './compare_code_units.ts';
import { buildDirectoryEntry } from './zip/build_directory_entry.ts';
import type { ZipEntry } from './zip/zip_entry.ts';

function toArchivePath(
	options: Readonly<{ directory: string; absolutePath: string }>
): string {
	return path
		.join(
			path.basename(options.directory),
			path.relative(options.directory, options.absolutePath)
		)
		.split(path.sep)
		.join('/');
}

/**
 * Turns a directory into zip entries with the directory itself as the archive root, sorted by name,
 * so the same folder content always gives the same archive.
 */
export async function buildDirectoryZipEntries(
	options: Readonly<{ directory: string }>
): Promise<ZipEntry[]> {
	const { directory } = options;
	const children = await readdir(directory, {
		recursive: true,
		withFileTypes: true,
	});
	const childEntries = await Promise.all(
		children.map(async (child): Promise<ZipEntry> => {
			const absolutePath = path.join(child.parentPath, child.name);
			const archivePath = toArchivePath({ directory, absolutePath });
			return child.isDirectory()
				? buildDirectoryEntry({ path: archivePath })
				: { name: archivePath, data: await readFile(absolutePath) };
		})
	);
	return [
		buildDirectoryEntry({ path: path.basename(directory) }),
		...childEntries,
	].sort((first, second) => compareCodeUnits(first.name, second.name));
}
