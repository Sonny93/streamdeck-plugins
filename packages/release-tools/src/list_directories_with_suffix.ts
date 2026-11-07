import { readdir } from 'node:fs/promises';
import path from 'node:path';

import { compareCodeUnits } from './compare_code_units.ts';

/** Lists, sorted, the absolute paths of the folders directly inside a directory whose name ends with the suffix. */
export async function listDirectoriesWithSuffix(
	options: Readonly<{ directory: string; suffix: string }>
): Promise<string[]> {
	const children = await readdir(options.directory, { withFileTypes: true });
	return children
		.filter(
			(child) => child.isDirectory() && child.name.endsWith(options.suffix)
		)
		.map((child) => path.join(options.directory, child.name))
		.sort(compareCodeUnits);
}
