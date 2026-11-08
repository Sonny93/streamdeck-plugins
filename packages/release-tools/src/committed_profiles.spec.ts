import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

import { filterProfile } from './filter_profile.ts';
import { listPluginSubsets } from './list_plugin_subsets.ts';
import { listProfileIntegrityProblems } from './list_profile_integrity_problems.ts';
import { listProfilePlugins } from './list_profile_plugins.ts';
import { readProfileDirectory } from './read_profile_directory.ts';
import { readWorkspacePluginUuids } from './read_workspace_plugin_uuids.ts';
import { ReleasePaths } from './release_paths.ts';
import { removePersonalSettings } from './remove_personal_settings.ts';

async function listCommittedProfileJsonFiles(): Promise<readonly string[]> {
	const entries = await readdir(ReleasePaths.profilesDirectory, {
		recursive: true,
	});
	return entries.filter((entry) => entry.endsWith('.json')).sort();
}

async function listCommittedProfileDirectories(): Promise<readonly string[]> {
	const entries = await readdir(ReleasePaths.profilesDirectory, {
		withFileTypes: true,
	});
	return entries
		.filter((entry) => entry.isDirectory())
		.map((entry) => path.join(ReleasePaths.profilesDirectory, entry.name))
		.sort();
}

const profileJsonFiles = await listCommittedProfileJsonFiles();
const profileDirectories = await listCommittedProfileDirectories();
const workspacePlugins = await readWorkspacePluginUuids({
	pluginsDirectory: ReleasePaths.pluginsDirectory,
});

describe('committed profiles', () => {
	it('should find JSON files under the profiles directory', () => {
		expect(profileJsonFiles.length).toBeGreaterThan(0);
	});

	it.each(profileJsonFiles)(
		'should hold no personal settings in %s',
		async (relativePath) => {
			const content = await readFile(
				path.join(ReleasePaths.profilesDirectory, relativePath),
				'utf8'
			);
			const manifest: unknown = JSON.parse(content);

			expect(removePersonalSettings({ manifest })).toEqual(manifest);
		}
	);

	it.each(profileDirectories)(
		'should hold a sound profile in %s',
		async (profileDirectory) => {
			const { document } = await readProfileDirectory({ profileDirectory });

			expect(
				listProfileIntegrityProblems({
					document,
					allowedPlugins: workspacePlugins,
				})
			).toEqual([]);
		}
	);

	it.each(profileDirectories)(
		'should give a sound variant for every combination of plugins in %s',
		async (profileDirectory) => {
			const { document } = await readProfileDirectory({ profileDirectory });
			const subsets = listPluginSubsets({
				plugins: listProfilePlugins({ document }),
			});

			const problems = subsets.flatMap((subset) => {
				const allowedPlugins = new Set(subset);
				return listProfileIntegrityProblems({
					document: filterProfile({ document, allowedPlugins }),
					allowedPlugins,
				}).map((problem) => `${subset.join('+')}: ${problem}`);
			});

			expect(subsets.length).toBeGreaterThan(0);
			expect(problems).toEqual([]);
		}
	);
});
