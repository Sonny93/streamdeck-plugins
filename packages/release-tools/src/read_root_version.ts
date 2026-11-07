import { readFile } from 'node:fs/promises';

import { ReleasePaths } from './release_paths.ts';

/** Reads the `version` field of the root package.json as it is, for the caller to validate. */
export async function readRootVersion(): Promise<unknown> {
	const rootPackage: unknown = JSON.parse(
		await readFile(ReleasePaths.rootPackageFile, 'utf8')
	);
	return typeof rootPackage === 'object' && rootPackage !== null
		? Reflect.get(rootPackage, 'version')
		: undefined;
}
