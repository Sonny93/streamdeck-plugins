import { cp, readdir } from 'node:fs/promises';
import path from 'node:path';

import { compareCodeUnits } from './compare_code_units.ts';
import { ReleaseFormats } from './release_formats.ts';

/** Copies every `*.streamDeckProfile` of the profiles directory into the output directory and returns the paths of the copies. */
export async function copyProfiles(
	options: Readonly<{ profilesDirectory: string; outputDirectory: string }>
): Promise<string[]> {
	const names = (await readdir(options.profilesDirectory))
		.filter((name) => name.endsWith(ReleaseFormats.profileFileExtension))
		.sort(compareCodeUnits);
	return Promise.all(
		names.map(async (name) => {
			const destination = path.join(options.outputDirectory, name);
			await cp(path.join(options.profilesDirectory, name), destination);
			return destination;
		})
	);
}
