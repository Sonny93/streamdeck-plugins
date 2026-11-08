import { cp } from 'node:fs/promises';
import path from 'node:path';

import { filterProfileDirectory } from './filter_profile_directory.ts';
import { packProfile } from './pack_profile.ts';

/**
 * Packs a copy of a profile folder filtered to `allowedPlugins` into `<variantName>.streamDeckProfile` and returns the path of the file.
 * The copy lives in the staging directory under the variant name, which names the file.
 */
export async function packProfileVariant(
	options: Readonly<{
		profileDirectory: string;
		variantName: string;
		allowedPlugins: ReadonlySet<string>;
		outputDirectory: string;
		stagingDirectory: string;
	}>
): Promise<string> {
	const stagedDirectory = path.join(
		options.stagingDirectory,
		options.variantName
	);
	await cp(options.profileDirectory, stagedDirectory, { recursive: true });
	await filterProfileDirectory({
		profileDirectory: stagedDirectory,
		allowedPlugins: options.allowedPlugins,
	});
	return packProfile({
		profileDirectory: stagedDirectory,
		outputDirectory: options.outputDirectory,
	});
}
