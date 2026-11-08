import { mkdir, rm } from 'node:fs/promises';
import path from 'node:path';

import { buildReleaseBundle } from './build_release_bundle.ts';
import { findPluginDirectories } from './find_plugin_directories.ts';
import { listDirectoriesWithSuffix } from './list_directories_with_suffix.ts';
import { listPackedFiles } from './list_packed_files.ts';
import { packIconPack } from './pack_icon_pack.ts';
import { packPlugin } from './pack_plugin.ts';
import { packProfileVariants } from './pack_profile_variants.ts';
import { readFullReleaseVersion } from './read_full_release_version.ts';
import { readReleaseVersion } from './read_release_version.ts';
import { readWorkspacePluginUuids } from './read_workspace_plugin_uuids.ts';
import { ReleaseFormats } from './release_formats.ts';
import { ReleasePaths } from './release_paths.ts';
import { writeProfilesIndex } from './write_profiles_index.ts';

/**
 * Builds the files of a GitHub release into `dist/`: one package per plugin, the icon packs, the profiles with their variants for fewer plugins and the index of the variants,
 * then the bundle zip with all of them, the install script and its launcher. Returns the paths of the files produced.
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
		const workspacePlugins = await readWorkspacePluginUuids({
			pluginsDirectory: ReleasePaths.pluginsDirectory,
		});
		const packedProfiles = await Promise.all(
			(
				await listDirectoriesWithSuffix({
					directory: ReleasePaths.profilesDirectory,
					suffix: '',
				})
			).map((profileDirectory) =>
				packProfileVariants({
					profileDirectory,
					workspacePlugins,
					outputDirectory,
					stagingDirectory,
				})
			)
		);
		const profileFiles = listPackedFiles({
			packedProfiles,
			outputDirectory,
			folder: '.',
		});
		const profileVariantFiles = listPackedFiles({
			packedProfiles,
			outputDirectory,
			folder: ReleaseFormats.profileVariantsFolder,
		});
		const profilesIndexFile = await writeProfilesIndex({
			profiles: packedProfiles,
			outputDirectory,
		});
		const bundleFile = await buildReleaseBundle({
			pluginFiles,
			iconPackFiles,
			profileFiles,
			profileVariantFiles,
			profilesIndexFile,
			rootFiles: [
				ReleasePaths.installScriptFile,
				ReleasePaths.setupLauncherFile,
			],
			bundleFile: path.join(
				outputDirectory,
				`${ReleaseFormats.bundleNamePrefix}${await readFullReleaseVersion()}.zip`
			),
		});
		return [
			...pluginFiles,
			...iconPackFiles,
			...profileFiles,
			...profileVariantFiles,
			profilesIndexFile,
			bundleFile,
		];
	} finally {
		await rm(stagingDirectory, { recursive: true, force: true });
	}
}
