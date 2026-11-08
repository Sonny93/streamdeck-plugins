import {
	access,
	mkdir,
	mkdtemp,
	readFile,
	readdir,
	rm,
	writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { importProfile } from './import_profile.ts';
import { UnsafeArchivePathError } from './unsafe_archive_path_error.ts';
import { buildZip } from './zip/build_zip.ts';
import type { ZipEntry } from './zip/zip_entry.ts';

const MANIFEST_PATH = 'Profiles/AAA.sdProfile/manifest.json';

let workDirectory = '';
let profilesDirectory = '';

beforeEach(async () => {
	workDirectory = await mkdtemp(path.join(tmpdir(), 'release-tools-'));
	profilesDirectory = path.join(workDirectory, 'profiles');
});

afterEach(async () => {
	await rm(workDirectory, { recursive: true, force: true });
});

function buildJsonEntry(name: string, content: unknown): ZipEntry {
	return { name, data: Buffer.from(JSON.stringify(content)) };
}

async function writeArchive(entries: readonly ZipEntry[]): Promise<string> {
	const archiveFile = path.join(workDirectory, 'export.streamDeckProfile');
	await writeFile(archiveFile, buildZip({ entries }));
	return archiveFile;
}

describe('importProfile', () => {
	it('should write the archive into a folder named after the profile, with JSON pretty-printed with tabs', async () => {
		const archiveFile = await writeArchive([
			buildJsonEntry(MANIFEST_PATH, { Name: 'Spotify Deck' }),
		]);

		const directory = await importProfile({ archiveFile, profilesDirectory });

		expect(path.basename(directory)).toBe('spotify-deck');
		expect(await readFile(path.join(directory, MANIFEST_PATH), 'utf8')).toBe(
			'{\n\t"Name": "Spotify Deck"\n}\n'
		);
	});

	it('should write a page manifest without the personal settings of the plugin actions', async () => {
		const archiveFile = await writeArchive([
			buildJsonEntry(MANIFEST_PATH, {
				Name: 'Deck',
				Controllers: [
					{
						Type: 'Keypad',
						Actions: {
							'0,0': {
								UUID: 'com.sonny93.audio.default-output',
								Settings: { device: 'endpoint-guid', label: 'Speakers' },
							},
						},
					},
				],
			}),
		]);

		const directory = await importProfile({ archiveFile, profilesDirectory });

		const written: unknown = JSON.parse(
			await readFile(path.join(directory, MANIFEST_PATH), 'utf8')
		);
		expect(written).toEqual({
			Name: 'Deck',
			Controllers: [
				{
					Type: 'Keypad',
					Actions: {
						'0,0': {
							UUID: 'com.sonny93.audio.default-output',
							Settings: { label: 'Speakers' },
						},
					},
				},
			],
		});
	});

	it('should replace the content the folder had', async () => {
		const first = await writeArchive([
			buildJsonEntry(MANIFEST_PATH, { Name: 'Deck' }),
			{ name: 'old.txt', data: Buffer.from('old') },
		]);
		await importProfile({ archiveFile: first, profilesDirectory });
		const second = await writeArchive([
			buildJsonEntry(MANIFEST_PATH, { Name: 'Deck' }),
		]);

		const directory = await importProfile({
			archiveFile: second,
			profilesDirectory,
		});

		expect(await readdir(directory)).toEqual(['Profiles']);
	});

	it('should write nothing when an entry path is unsafe', async () => {
		const archiveFile = await writeArchive([
			buildJsonEntry(MANIFEST_PATH, { Name: 'Deck' }),
			{ name: '../outside.txt', data: Buffer.from('x') },
		]);

		await expect(
			importProfile({ archiveFile, profilesDirectory })
		).rejects.toThrow(UnsafeArchivePathError);
		await expect(readdir(profilesDirectory)).rejects.toThrow();
	});

	it('should keep the existing folder when an entry cannot be formatted', async () => {
		const existingDirectory = path.join(profilesDirectory, 'deck');
		await mkdir(existingDirectory, { recursive: true });
		await writeFile(path.join(existingDirectory, 'keep.txt'), 'keep');
		const archiveFile = await writeArchive([
			buildJsonEntry(MANIFEST_PATH, { Name: 'Deck' }),
			{ name: 'bad.json', data: Buffer.from('{') },
		]);

		await expect(
			importProfile({ archiveFile, profilesDirectory })
		).rejects.toThrow();

		await expect(
			access(path.join(existingDirectory, 'keep.txt'))
		).resolves.toBeUndefined();
		expect(await readdir(profilesDirectory)).toEqual(['deck']);
	});
});
