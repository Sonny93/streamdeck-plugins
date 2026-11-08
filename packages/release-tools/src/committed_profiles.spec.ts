import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

import { ReleasePaths } from './release_paths.ts';
import { removePersonalSettings } from './remove_personal_settings.ts';

async function listCommittedProfileJsonFiles(): Promise<readonly string[]> {
	const entries = await readdir(ReleasePaths.profilesDirectory, {
		recursive: true,
	});
	return entries.filter((entry) => entry.endsWith('.json')).sort();
}

const profileJsonFiles = await listCommittedProfileJsonFiles();

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
});
