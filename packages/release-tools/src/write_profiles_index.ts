import { writeFile } from 'node:fs/promises';
import path from 'node:path';

import type { PackedProfile } from './packed_profile.ts';
import { ReleaseFormats } from './release_formats.ts';
import { stringifyProfileJson } from './stringify_profile_json.ts';

/**
 * Writes `profiles-index.json` into the output directory, which tells the install script which file to import for the plugins a computer has:
 * `{ profiles: [{ name, variants: [{ plugins, file }] }] }`, with `file` relative to the folder the profiles ship in. Returns the path of the file.
 */
export async function writeProfilesIndex(
	options: Readonly<{
		profiles: readonly PackedProfile[];
		outputDirectory: string;
	}>
): Promise<string> {
	const indexFile = path.join(
		options.outputDirectory,
		ReleaseFormats.profilesIndexFile
	);
	await writeFile(
		indexFile,
		stringifyProfileJson({ profiles: options.profiles })
	);
	return indexFile;
}
