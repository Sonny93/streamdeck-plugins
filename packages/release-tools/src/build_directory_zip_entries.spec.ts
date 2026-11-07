import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { buildDirectoryZipEntries } from './build_directory_zip_entries.ts';

let workDirectory = '';

beforeEach(async () => {
	workDirectory = await mkdtemp(path.join(tmpdir(), 'release-tools-'));
});

afterEach(async () => {
	await rm(workDirectory, { recursive: true, force: true });
});

async function createPackFolder(): Promise<string> {
	const packDirectory = path.join(workDirectory, 'keys.sdIconPack');
	await mkdir(path.join(packDirectory, 'icons'), { recursive: true });
	await writeFile(path.join(packDirectory, 'manifest.json'), '{}');
	await writeFile(path.join(packDirectory, 'icons', 'b.png'), 'b');
	await writeFile(path.join(packDirectory, 'icons', 'a.png'), 'a');
	return packDirectory;
}

describe('buildDirectoryZipEntries', () => {
	it('should list the folder as the archive root, then its content sorted by name', async () => {
		const entries = await buildDirectoryZipEntries({
			directory: await createPackFolder(),
		});

		expect(entries.map((entry) => entry.name)).toEqual([
			'keys.sdIconPack/',
			'keys.sdIconPack/icons/',
			'keys.sdIconPack/icons/a.png',
			'keys.sdIconPack/icons/b.png',
			'keys.sdIconPack/manifest.json',
		]);
	});

	it('should give files their content and folders no data', async () => {
		const entries = await buildDirectoryZipEntries({
			directory: await createPackFolder(),
		});

		expect(
			entries.map((entry) => Buffer.from(entry.data).toString('utf8'))
		).toEqual(['', '', 'a', 'b', '{}']);
	});
});
