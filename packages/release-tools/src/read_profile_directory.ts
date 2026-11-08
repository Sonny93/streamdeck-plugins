import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { InvalidProfileError } from './invalid_profile_error.ts';
import { isRecord } from './is_record.ts';
import { listDirectoriesWithSuffix } from './list_directories_with_suffix.ts';
import type { ProfileOnDisk } from './profile_directory.ts';
import type { JsonRecord } from './profile_document.ts';
import { ReleaseFormats } from './release_formats.ts';

const PROFILES_FOLDER = 'Profiles';
const PROFILE_FOLDER_SUFFIX = '.sdProfile';

async function readJsonRecord(file: string): Promise<JsonRecord> {
	const parsed: unknown = JSON.parse(await readFile(file, 'utf8'));
	if (!isRecord(parsed)) {
		throw new InvalidProfileError({ reason: `${file} is not a JSON object` });
	}
	return parsed;
}

async function findSdProfileDirectory(
	profileDirectory: string
): Promise<string> {
	const found = await listDirectoriesWithSuffix({
		directory: path.join(profileDirectory, PROFILES_FOLDER),
		suffix: PROFILE_FOLDER_SUFFIX,
	});
	const [sdProfileDirectory] = found;
	if (sdProfileDirectory === undefined || found.length !== 1) {
		throw new InvalidProfileError({
			reason: `${profileDirectory} must hold exactly one Profiles/<uuid>${PROFILE_FOLDER_SUFFIX} folder`,
		});
	}
	return sdProfileDirectory;
}

/** Reads the manifests of a `profiles/<name>` folder: the root one and the one of every page folder. */
export async function readProfileDirectory(
	options: Readonly<{ profileDirectory: string }>
): Promise<ProfileOnDisk> {
	const sdProfileDirectory = await findSdProfileDirectory(
		options.profileDirectory
	);
	const pageFolders = await listDirectoriesWithSuffix({
		directory: path.join(sdProfileDirectory, PROFILES_FOLDER),
		suffix: '',
	});
	const pages = await Promise.all(
		pageFolders.map(
			async (pageFolder) =>
				[
					path.basename(pageFolder).toLowerCase(),
					await readJsonRecord(
						path.join(pageFolder, ReleaseFormats.manifestFile)
					),
				] as const
		)
	);
	return {
		sdProfileDirectory,
		document: {
			rootManifest: await readJsonRecord(
				path.join(sdProfileDirectory, ReleaseFormats.manifestFile)
			),
			pages: new Map(pages),
		},
		pageDirectories: new Map(
			pageFolders.map((pageFolder) => [
				path.basename(pageFolder).toLowerCase(),
				pageFolder,
			])
		),
	};
}
