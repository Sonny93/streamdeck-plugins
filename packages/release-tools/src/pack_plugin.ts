import path from 'node:path';

import { copyToStaging } from './copy_to_staging.ts';
import { ReleaseFormats } from './release_formats.ts';
import { requireBuiltFile } from './require_built_file.ts';
import { runStreamDeckPack } from './run_stream_deck_pack.ts';

/** Packs a built `*.sdPlugin` folder into `<uuid>.streamDeckPlugin` and returns the path of the file. */
export async function packPlugin(
	options: Readonly<{
		sdPluginDirectory: string;
		outputDirectory: string;
		stagingDirectory: string;
		version: string;
	}>
): Promise<string> {
	const { sdPluginDirectory, outputDirectory, stagingDirectory, version } =
		options;
	await requireBuiltFile({
		filePath: path.join(sdPluginDirectory, ReleaseFormats.pluginEntryFile),
	});
	const stagedDirectory = await copyToStaging({
		source: sdPluginDirectory,
		stagingDirectory,
	});
	await runStreamDeckPack({
		pluginDirectory: path.dirname(sdPluginDirectory),
		stagedDirectory,
		outputDirectory,
		version,
	});
	const uuid = path.basename(
		sdPluginDirectory,
		ReleaseFormats.pluginFolderSuffix
	);
	return path.join(outputDirectory, `${uuid}.streamDeckPlugin`);
}
