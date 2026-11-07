import path from 'node:path';

import { importProfile } from './import_profile.ts';
import { ReleasePaths } from './release_paths.ts';

/** Imports an exported profile archive into `profiles/` and returns the folder written. Relative paths resolve from where the command was typed. */
export async function runImportProfile(
	options: Readonly<{
		archiveFile: string;
		name: string | undefined;
		workingDirectory: string;
	}>
): Promise<string> {
	return importProfile({
		archiveFile: path.resolve(options.workingDirectory, options.archiveFile),
		profilesDirectory: ReleasePaths.profilesDirectory,
		...(options.name === undefined ? {} : { name: options.name }),
	});
}
