import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { compareCodeUnits } from './compare_code_units.ts';
import { ReleaseFormats } from './release_formats.ts';
import { buildZip } from './zip/build_zip.ts';
import type { ZipEntry } from './zip/zip_entry.ts';

async function buildFileEntry(
	options: Readonly<{ folder: string; file: string }>
): Promise<ZipEntry> {
	const name = path.basename(options.file);
	return {
		name: options.folder === '' ? name : `${options.folder}/${name}`,
		data: await readFile(options.file),
	};
}

/**
 * Writes the zip that holds every release file, the same bytes as the individual files, with the install script and its launcher at its root:
 * plugins under `plugins/`, icon packs under `icons/`, profiles under `profiles/` with their variants under `profiles/variants/` and the index of the variants beside them. Returns the path of the zip.
 */
export async function buildReleaseBundle(
	options: Readonly<{
		pluginFiles: readonly string[];
		iconPackFiles: readonly string[];
		profileFiles: readonly string[];
		profileVariantFiles: readonly string[];
		profilesIndexFile: string;
		rootFiles: readonly string[];
		bundleFile: string;
	}>
): Promise<string> {
	const entries = await Promise.all([
		...options.pluginFiles.map((file) =>
			buildFileEntry({ folder: ReleaseFormats.bundlePluginsFolder, file })
		),
		...options.iconPackFiles.map((file) =>
			buildFileEntry({ folder: ReleaseFormats.bundleIconsFolder, file })
		),
		...options.profileFiles.map((file) =>
			buildFileEntry({ folder: ReleaseFormats.bundleProfilesFolder, file })
		),
		...options.profileVariantFiles.map((file) =>
			buildFileEntry({
				folder: `${ReleaseFormats.bundleProfilesFolder}/${ReleaseFormats.profileVariantsFolder}`,
				file,
			})
		),
		buildFileEntry({
			folder: ReleaseFormats.bundleProfilesFolder,
			file: options.profilesIndexFile,
		}),
		...options.rootFiles.map((file) => buildFileEntry({ folder: '', file })),
	]);
	entries.sort((first, second) => compareCodeUnits(first.name, second.name));
	await writeFile(options.bundleFile, buildZip({ entries }));
	return options.bundleFile;
}
