import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { findPluginDirectories } from './find_plugin_directories.ts';
import { InvalidProfileError } from './invalid_profile_error.ts';
import { isRecord } from './is_record.ts';
import { ReleaseFormats } from './release_formats.ts';

async function readPluginUuid(sdPluginDirectory: string): Promise<string> {
	const manifest: unknown = JSON.parse(
		await readFile(
			path.join(sdPluginDirectory, ReleaseFormats.manifestFile),
			'utf8'
		)
	);
	if (!isRecord(manifest) || typeof manifest['UUID'] !== 'string') {
		throw new InvalidProfileError({
			reason: `${sdPluginDirectory} has a manifest without UUID`,
		});
	}
	return manifest['UUID'];
}

/** Reads the `UUID` of every plugin of the workspace, from the manifest of its `.sdPlugin` folder. */
export async function readWorkspacePluginUuids(
	options: Readonly<{ pluginsDirectory: string }>
): Promise<ReadonlySet<string>> {
	const directories = await findPluginDirectories(options);
	return new Set(await Promise.all(directories.map(readPluginUuid)));
}
