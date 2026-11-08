import { mkdir } from 'node:fs/promises';
import path from 'node:path';

import { buildVariantName } from './build_variant_name.ts';
import { listPluginSubsets } from './list_plugin_subsets.ts';
import { listProfilePlugins } from './list_profile_plugins.ts';
import { packProfileVariant } from './pack_profile_variant.ts';
import type { PackedProfile } from './packed_profile.ts';
import { readProfileDirectory } from './read_profile_directory.ts';
import { ReleaseFormats } from './release_formats.ts';

function readProfileTitle(
	rootManifest: Readonly<Record<string, unknown>>
): string {
	const title = rootManifest['Name'];
	return typeof title === 'string' ? title : '';
}

function toIndexPath(
	options: Readonly<{ file: string; outputDirectory: string }>
): string {
	return path
		.relative(options.outputDirectory, options.file)
		.split(path.sep)
		.join('/');
}

/**
 * Packs a profile once for every combination of the workspace plugins it uses: the whole set goes to `<name>.streamDeckProfile` in the output directory,
 * the smaller ones to `variants/<name>--<plugins>.streamDeckProfile`.
 */
export async function packProfileVariants(
	options: Readonly<{
		profileDirectory: string;
		workspacePlugins: ReadonlySet<string>;
		outputDirectory: string;
		stagingDirectory: string;
	}>
): Promise<PackedProfile> {
	const { profileDirectory, outputDirectory, stagingDirectory } = options;
	const { document } = await readProfileDirectory({ profileDirectory });
	const plugins = listProfilePlugins({ document }).filter((pluginUuid) =>
		options.workspacePlugins.has(pluginUuid)
	);
	const variantsDirectory = path.join(
		outputDirectory,
		ReleaseFormats.profileVariantsFolder
	);
	await mkdir(variantsDirectory, { recursive: true });
	const profileName = path.basename(profileDirectory);
	const subsets = listPluginSubsets({ plugins });
	const files = await Promise.all(
		[plugins, ...subsets.slice(1)].map(async (subset, index) => ({
			plugins: subset,
			file: await packProfileVariant({
				profileDirectory,
				variantName:
					index === 0
						? profileName
						: buildVariantName({ profileName, plugins: subset }),
				allowedPlugins: new Set(subset),
				outputDirectory: index === 0 ? outputDirectory : variantsDirectory,
				stagingDirectory,
			}),
		}))
	);
	return {
		name: readProfileTitle(document.rootManifest),
		variants: files.map((variant) => ({
			plugins: variant.plugins,
			file: toIndexPath({ file: variant.file, outputDirectory }),
		})),
	};
}
