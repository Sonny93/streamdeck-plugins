import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { buildDirectoryContentsZipEntries } from './build_directory_contents_zip_entries.ts';

let workDirectory = '';

beforeEach(async () => {
	workDirectory = await mkdtemp(path.join(tmpdir(), 'release-tools-'));
});

afterEach(async () => {
	await rm(workDirectory, { recursive: true, force: true });
});

describe('buildDirectoryContentsZipEntries', () => {
	it('should list the content of the folder at the archive root, sorted by name', async () => {
		const directory = path.join(workDirectory, 'deck');
		await mkdir(path.join(directory, 'Profiles', 'Images'), {
			recursive: true,
		});
		await writeFile(path.join(directory, 'package.json'), '{}');
		await writeFile(path.join(directory, 'Profiles', 'b.json'), 'b');
		await writeFile(path.join(directory, 'Profiles', 'Images', 'a.png'), 'a');

		const entries = await buildDirectoryContentsZipEntries({ directory });

		expect(entries.map((entry) => entry.name)).toEqual([
			'Profiles/',
			'Profiles/Images/',
			'Profiles/Images/a.png',
			'Profiles/b.json',
			'package.json',
		]);
	});
});
