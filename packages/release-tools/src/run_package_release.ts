import { mkdir, rm } from 'node:fs/promises';

import { copyProfiles } from './copy_profiles.ts';
import { findPluginDirectories } from './find_plugin_directories.ts';
import { listDirectoriesWithSuffix } from './list_directories_with_suffix.ts';
import { packIconPack } from './pack_icon_pack.ts';
import { packPlugin } from './pack_plugin.ts';
import { readReleaseVersion } from './read_release_version.ts';
import { ReleaseFormats } from './release_formats.ts';
import { ReleasePaths } from './release_paths.ts';

/**
 * Builds the files of a GitHub release into `dist/`: one package per plugin, the icon packs and the profiles.
 * Returns the paths of the files produced.
 */
export async function runPackageRelease(): Promise<string[]> {
	const version = await readReleaseVersion();
	const outputDirectory = ReleasePaths.distDirectory;
	const stagingDirectory = ReleasePaths.stagingDirectory;
	await rm(outputDirectory, { recursive: true, force: true });
	await mkdir(stagingDirectory, { recursive: true });
	try {
		const pluginFiles = await Promise.all(
			(
				await findPluginDirectories({
					pluginsDirectory: ReleasePaths.pluginsDirectory,
				})
			).map((sdPluginDirectory) =>
				packPlugin({
					sdPluginDirectory,
					outputDirectory,
					stagingDirectory,
					version,
				})
			)
		);
		const iconPackFiles = await Promise.all(
			(
				await listDirectoriesWithSuffix({
					directory: ReleasePaths.iconPackDirectory,
					suffix: ReleaseFormats.iconPackFolderSuffix,
				})
			).map((iconPackDirectory) =>
				packIconPack({
					iconPackDirectory,
					outputDirectory,
					stagingDirectory,
					version,
				})
			)
		);
		const profileFiles = await copyProfiles({
			profilesDirectory: ReleasePaths.profilesDirectory,
			outputDirectory,
		});
		return [...pluginFiles, ...iconPackFiles, ...profileFiles];
	} finally {
		await rm(stagingDirectory, { recursive: true, force: true });
	}
}
