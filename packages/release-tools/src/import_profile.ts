import { mkdir, readFile, rename, rm } from 'node:fs/promises';
import path from 'node:path';

import { assertSafeArchivePath } from './assert_safe_archive_path.ts';
import { filterProfileDirectory } from './filter_profile_directory.ts';
import { InvalidProfileError } from './invalid_profile_error.ts';
import { prepareProfileFiles } from './prepare_profile_files.ts';
import { readProfileName } from './read_profile_name.ts';
import { readZip } from './read_zip.ts';
import { slugifyProfileName } from './slugify_profile_name.ts';
import { writeProfileEntries } from './write_profile_entries.ts';

const FOLDER_NAME_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/u;

function resolveFolderName(
	options: Readonly<{ name: string | undefined; profileName: string }>
): string {
	if (options.name === undefined) {
		return slugifyProfileName({ name: options.profileName });
	}
	if (!FOLDER_NAME_PATTERN.test(options.name)) {
		throw new InvalidProfileError({
			reason: `The folder name ${JSON.stringify(options.name)} must be lower-case words joined with dashes`,
		});
	}
	return options.name;
}

/**
 * Replaces `<profilesDirectory>/<name>/` with the content of an exported `.streamDeckProfile` archive and returns that folder.
 * Every entry is validated and formatted before anything is written, then written to a temporary folder, filtered to the actions of `allowedPlugins`, that replaces the old one, so a failed import keeps the old folder. The name defaults to the slug of the profile name.
 */
export async function importProfile(
	options: Readonly<{
		archiveFile: string;
		profilesDirectory: string;
		allowedPlugins: ReadonlySet<string>;
		name?: string;
	}>
): Promise<string> {
	const entries = readZip({ archive: await readFile(options.archiveFile) });
	for (const entry of entries) {
		assertSafeArchivePath({ entryName: entry.name });
	}
	const folderName = resolveFolderName({
		name: options.name,
		profileName: readProfileName({ entries }),
	});
	const directory = path.join(options.profilesDirectory, folderName);
	const stagingDirectory = path.join(
		options.profilesDirectory,
		`.${folderName}.importing`
	);
	const files = prepareProfileFiles({
		directory: stagingDirectory,
		entries,
	});
	await rm(stagingDirectory, { recursive: true, force: true });
	try {
		await mkdir(stagingDirectory, { recursive: true });
		await writeProfileEntries({ files });
		await filterProfileDirectory({
			profileDirectory: stagingDirectory,
			allowedPlugins: options.allowedPlugins,
		});
		await rm(directory, { recursive: true, force: true });
		await rename(stagingDirectory, directory);
	} finally {
		await rm(stagingDirectory, { recursive: true, force: true });
	}
	return directory;
}
