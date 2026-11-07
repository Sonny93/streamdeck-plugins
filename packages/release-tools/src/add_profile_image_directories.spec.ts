import { describe, expect, it } from 'vitest';

import { addProfileImageDirectories } from './add_profile_image_directories.ts';
import { buildDirectoryEntry } from './zip/build_directory_entry.ts';
import type { ZipEntry } from './zip/zip_entry.ts';

const PROFILE = 'Profiles/AAA.sdProfile';
const PAGE = `${PROFILE}/Profiles/BBB`;

function buildFile(name: string): ZipEntry {
	return { name, data: Buffer.from('{}') };
}

describe('addProfileImageDirectories', () => {
	it('should add the missing Images folder of the profile and of every page', () => {
		const entries = addProfileImageDirectories({
			entries: [
				buildFile('package.json'),
				buildDirectoryEntry({ path: 'Profiles' }),
				buildDirectoryEntry({ path: PROFILE }),
				buildFile(`${PROFILE}/manifest.json`),
				buildDirectoryEntry({ path: `${PROFILE}/Profiles` }),
				buildDirectoryEntry({ path: PAGE }),
				buildFile(`${PAGE}/manifest.json`),
			],
		});

		expect(entries.map((entry) => entry.name)).toEqual([
			'Profiles/',
			`${PROFILE}/`,
			`${PROFILE}/Images/`,
			`${PROFILE}/Profiles/`,
			`${PAGE}/`,
			`${PAGE}/Images/`,
			`${PAGE}/manifest.json`,
			`${PROFILE}/manifest.json`,
			'package.json',
		]);
	});

	it('should not duplicate an Images folder that exists', () => {
		const entries = addProfileImageDirectories({
			entries: [
				buildDirectoryEntry({ path: PROFILE }),
				buildDirectoryEntry({ path: `${PROFILE}/Images` }),
			],
		});

		expect(
			entries.filter((entry) => entry.name === `${PROFILE}/Images/`)
		).toHaveLength(1);
	});
});
