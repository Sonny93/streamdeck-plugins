import path from 'node:path';

import { importProfile } from './import_profile.ts';
import { readWorkspacePluginUuids } from './read_workspace_plugin_uuids.ts';
import { ReleasePaths } from './release_paths.ts';

/** Imports an exported profile archive into `profiles/`, keeping only the actions of the workspace plugins, and returns the folder written. Relative paths resolve from where the command was typed. */
export async function runImportProfile(
	options: Readonly<{
		archiveFile: string;
		name: string | undefined;
		workingDirectory: string;
	}>
): Promise<string> {
	return importProfile({
		archiveFile: path.resolve(options.workingDirectory, options.archiveFile),
		profilesDirectory: ReleasePaths.profilesDirectory,
		allowedPlugins: await readWorkspacePluginUuids({
			pluginsDirectory: ReleasePaths.pluginsDirectory,
		}),
		...(options.name === undefined ? {} : { name: options.name }),
	});
}
