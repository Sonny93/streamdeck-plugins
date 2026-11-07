import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

import type { PreparedProfileFile } from './prepare_profile_files.ts';

/** Writes prepared files and folders to disk, creating the parent folders. */
export async function writeProfileEntries(
	options: Readonly<{ files: readonly PreparedProfileFile[] }>
): Promise<void> {
	await Promise.all(
		options.files.map(async ({ target, contents }) => {
			if (contents === null) {
				await mkdir(target, { recursive: true });
				return;
			}
			await mkdir(path.dirname(target), { recursive: true });
			await writeFile(target, contents);
		})
	);
}
