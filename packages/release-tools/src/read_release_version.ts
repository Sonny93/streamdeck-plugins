import { readFile } from 'node:fs/promises';

import { parseReleaseVersion } from './parse_release_version.ts';
import { ReleasePaths } from './release_paths.ts';

/** Reads the one version of the repository from the root package.json. */
export async function readReleaseVersion(): Promise<string> {
	const rootPackage: unknown = JSON.parse(
		await readFile(ReleasePaths.rootPackageFile, 'utf8')
	);
	const version: unknown =
		typeof rootPackage === 'object' && rootPackage !== null
			? Reflect.get(rootPackage, 'version')
			: undefined;
	return parseReleaseVersion({ version });
}
