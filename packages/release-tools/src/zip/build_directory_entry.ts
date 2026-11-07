import type { ZipEntry } from './zip_entry.ts';
import { ZipFormat } from './zip_format.ts';

/** Builds an empty directory entry; the path gets the trailing slash that marks it as a directory. */
export function buildDirectoryEntry(
	options: Readonly<{ path: string }>
): ZipEntry {
	return {
		name: `${options.path}${ZipFormat.directorySuffix}`,
		data: new Uint8Array(),
	};
}
