import type { ZipEntry } from 'deck-kit/zip/zip_entry';
import path from 'node:path';

import { formatProfileFile } from './format_profile_file.ts';
import { UnsafeArchivePathError } from './unsafe_archive_path_error.ts';

/** A file or folder to create: `contents` is `null` for a folder. */
export type PreparedProfileFile = Readonly<{
	target: string;
	contents: Uint8Array | null;
}>;

function resolveInside(
	options: Readonly<{ directory: string; entryName: string }>
): string {
	const target = path.resolve(options.directory, options.entryName);
	if (!target.startsWith(path.resolve(options.directory) + path.sep)) {
		throw new UnsafeArchivePathError({ entryName: options.entryName });
	}
	return target;
}

/** Resolves the target path of every entry and formats its content, without touching the disk, so a bad entry fails before anything is written. */
export function prepareProfileFiles(
	options: Readonly<{ directory: string; entries: readonly ZipEntry[] }>
): PreparedProfileFile[] {
	return options.entries.map((entry) => ({
		target: resolveInside({
			directory: options.directory,
			entryName: entry.name,
		}),
		contents: entry.name.endsWith('/')
			? null
			: formatProfileFile({ name: entry.name, data: entry.data }),
	}));
}
