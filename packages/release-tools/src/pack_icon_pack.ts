import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { buildDirectoryZipEntries } from './build_directory_zip_entries.ts';
import { copyToStaging } from './copy_to_staging.ts';
import { ReleaseFormats } from './release_formats.ts';
import { requireBuiltFile } from './require_built_file.ts';
import { setManifestVersion } from './set_manifest_version.ts';
import { buildZip } from './zip/build_zip.ts';

const BUILT_FILES = ['icons.json', 'icon.png'] as const;

/** Zips a built `*.sdIconPack` folder, with the version in its manifest, into `<name>.streamDeckIconPack` and returns the path of the file. */
export async function packIconPack(
	options: Readonly<{
		iconPackDirectory: string;
		outputDirectory: string;
		stagingDirectory: string;
		version: string;
	}>
): Promise<string> {
	const { iconPackDirectory, outputDirectory, stagingDirectory, version } =
		options;
	await Promise.all(
		BUILT_FILES.map((fileName) =>
			requireBuiltFile({ filePath: path.join(iconPackDirectory, fileName) })
		)
	);
	const stagedDirectory = await copyToStaging({
		source: iconPackDirectory,
		stagingDirectory,
	});
	const manifestFile = path.join(stagedDirectory, ReleaseFormats.manifestFile);
	await writeFile(
		manifestFile,
		setManifestVersion({
			manifestText: await readFile(manifestFile, 'utf8'),
			version,
		})
	);
	const archiveFile = path.join(
		outputDirectory,
		`${path.basename(iconPackDirectory, ReleaseFormats.iconPackFolderSuffix)}${ReleaseFormats.iconPackFileExtension}`
	);
	await writeFile(
		archiveFile,
		buildZip({
			entries: await buildDirectoryZipEntries({ directory: stagedDirectory }),
		})
	);
	return archiveFile;
}
