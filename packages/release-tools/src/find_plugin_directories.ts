import { readdir } from 'node:fs/promises';
import path from 'node:path';

import { compareCodeUnits } from './compare_code_units.ts';
import { listDirectoriesWithSuffix } from './list_directories_with_suffix.ts';
import { ReleaseFormats } from './release_formats.ts';

/** Finds the `*.sdPlugin` folder of every `plugins/<name>` folder, so a new plugin joins without any edit here. */
export async function findPluginDirectories(
	options: Readonly<{ pluginsDirectory: string }>
): Promise<string[]> {
	const children = await readdir(options.pluginsDirectory, {
		withFileTypes: true,
	});
	const found = await Promise.all(
		children
			.filter((child) => child.isDirectory())
			.map((child) =>
				listDirectoriesWithSuffix({
					directory: path.join(options.pluginsDirectory, child.name),
					suffix: ReleaseFormats.pluginFolderSuffix,
				})
			)
	);
	return found.flat().sort(compareCodeUnits);
}
