import { writeFile } from 'node:fs/promises';
import path from 'node:path';

import { addProfileImageDirectories } from './add_profile_image_directories.ts';
import { buildDirectoryContentsZipEntries } from './build_directory_contents_zip_entries.ts';
import { ReleaseFormats } from './release_formats.ts';
import { buildZip } from './zip/build_zip.ts';

/** Zips the content of a `profiles/<name>` folder, at the archive root, into `<name>.streamDeckProfile` and returns the path of the file. */
export async function packProfile(
	options: Readonly<{ profileDirectory: string; outputDirectory: string }>
): Promise<string> {
	const archiveFile = path.join(
		options.outputDirectory,
		`${path.basename(options.profileDirectory)}${ReleaseFormats.profileFileExtension}`
	);
	await writeFile(
		archiveFile,
		buildZip({
			entries: addProfileImageDirectories({
				entries: await buildDirectoryContentsZipEntries({
					directory: options.profileDirectory,
				}),
			}),
		})
	);
	return archiveFile;
}
