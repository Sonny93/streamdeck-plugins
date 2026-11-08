import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { buildReleaseBundle } from './build_release_bundle.ts';
import { readZip } from './read_zip.ts';

let workDirectory = '';

beforeEach(async () => {
	workDirectory = await mkdtemp(path.join(tmpdir(), 'release-tools-'));
});

afterEach(async () => {
	await rm(workDirectory, { recursive: true, force: true });
});

async function createFile(name: string, content: string): Promise<string> {
	const file = path.join(workDirectory, name);
	await writeFile(file, content);
	return file;
}

describe('buildReleaseBundle', () => {
	it('should put each kind of package in its folder, the variants under profiles/variants and the root files at the root, with the bytes of the files', async () => {
		const bundleFile = path.join(workDirectory, 'bundle.zip');

		await buildReleaseBundle({
			pluginFiles: [
				await createFile('com.sonny93.audio.streamDeckPlugin', 'plugin'),
			],
			iconPackFiles: [
				await createFile('com.sonny93.keys.streamDeckIconPack', 'pack'),
			],
			profileFiles: [
				await createFile('spotify-deck.streamDeckProfile', 'profile'),
			],
			profileVariantFiles: [
				await createFile('spotify-deck--audio.streamDeckProfile', 'variant'),
			],
			profilesIndexFile: await createFile('profiles-index.json', 'index'),
			rootFiles: [
				await createFile('install.ps1', 'script'),
				await createFile('Setup.cmd', 'launcher'),
			],
			bundleFile,
		});

		const entries = readZip({ archive: await readFile(bundleFile) });
		expect(
			entries.map((entry) => [
				entry.name,
				Buffer.from(entry.data).toString('utf8'),
			])
		).toEqual([
			['Setup.cmd', 'launcher'],
			['icons/com.sonny93.keys.streamDeckIconPack', 'pack'],
			['install.ps1', 'script'],
			['plugins/com.sonny93.audio.streamDeckPlugin', 'plugin'],
			['profiles/profiles-index.json', 'index'],
			['profiles/spotify-deck.streamDeckProfile', 'profile'],
			['profiles/variants/spotify-deck--audio.streamDeckProfile', 'variant'],
		]);
	});
});
