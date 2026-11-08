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
const PAGE_PATH = 'Profiles/AAA.sdProfile/Profiles/PAGE/manifest.json';
const OTHER_PAGE_PATH = 'Profiles/AAA.sdProfile/Profiles/OTHER/manifest.json';
const ALLOWED_PLUGINS: ReadonlySet<string> = new Set(['com.sonny93.audio']);

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

function buildRootManifest(
	options: Readonly<{ name: string; listedPages?: readonly string[] }>
): unknown {
	return {
		Name: options.name,
		Pages: {
			Current: '00000000-0000-0000-0000-000000000000',
			Default: 'page',
			Pages: options.listedPages ?? [],
		},
	};
}

function buildProfileEntries(
	options: Readonly<{ name: string; page?: unknown }>
): ZipEntry[] {
	return [
		buildJsonEntry(MANIFEST_PATH, buildRootManifest({ name: options.name })),
		buildJsonEntry(PAGE_PATH, options.page ?? { Controllers: [] }),
		buildJsonEntry('package.json', { RequiredPlugins: [] }),
	];
}

async function writeArchive(entries: readonly ZipEntry[]): Promise<string> {
	const archiveFile = path.join(workDirectory, 'export.streamDeckProfile');
	await writeFile(archiveFile, buildZip({ entries }));
	return archiveFile;
}

describe('importProfile', () => {
	it('should write the archive into a folder named after the profile, with JSON pretty-printed with tabs', async () => {
		const archiveFile = await writeArchive(
			buildProfileEntries({ name: 'Spotify Deck' })
		);

		const directory = await importProfile({
			archiveFile,
			profilesDirectory,
			allowedPlugins: ALLOWED_PLUGINS,
		});

		expect(path.basename(directory)).toBe('spotify-deck');
		expect(await readFile(path.join(directory, MANIFEST_PATH), 'utf8')).toBe(
			`${JSON.stringify(buildRootManifest({ name: 'Spotify Deck' }), null, '\t')}\n`
		);
	});

	it('should write a page manifest without the personal settings of the plugin actions', async () => {
		const action = {
			Plugin: { UUID: 'com.sonny93.audio' },
			UUID: 'com.sonny93.audio.default-output',
			Settings: { device: 'endpoint-guid', label: 'Speakers' },
		};
		const archiveFile = await writeArchive(
			buildProfileEntries({
				name: 'Deck',
				page: { Controllers: [{ Type: 'Keypad', Actions: { '0,0': action } }] },
			})
		);

		const directory = await importProfile({
			archiveFile,
			profilesDirectory,
			allowedPlugins: ALLOWED_PLUGINS,
		});

		const written: unknown = JSON.parse(
			await readFile(path.join(directory, PAGE_PATH), 'utf8')
		);
		expect(written).toEqual({
			Controllers: [
				{
					Type: 'Keypad',
					Actions: { '0,0': { ...action, Settings: { label: 'Speakers' } } },
				},
			],
		});
	});

	it('should drop the actions of a plugin that is not allowed, and the listed page and required plugin that go with them', async () => {
		const beamngAction = {
			Plugin: { UUID: 'com.sonny93.beamng' },
			UUID: 'com.sonny93.beamng.free-camera',
			Settings: {},
		};
		const archiveFile = await writeArchive([
			buildJsonEntry(MANIFEST_PATH, {
				...(buildRootManifest({ name: 'Deck' }) as object),
				Pages: {
					Current: '00000000-0000-0000-0000-000000000000',
					Default: 'page',
					Pages: ['other', 'third'],
				},
			}),
			buildJsonEntry(PAGE_PATH, {
				Controllers: [
					{
						Type: 'Keypad',
						Actions: {
							'0,0': {
								Plugin: { UUID: 'com.sonny93.audio' },
								UUID: 'com.sonny93.audio.mute',
								Settings: {},
							},
						},
					},
				],
			}),
			buildJsonEntry(OTHER_PAGE_PATH, {
				Controllers: [{ Type: 'Keypad', Actions: { '0,0': beamngAction } }],
			}),
			buildJsonEntry('Profiles/AAA.sdProfile/Profiles/THIRD/manifest.json', {
				Controllers: [
					{
						Type: 'Keypad',
						Actions: {
							'0,0': {
								Plugin: { UUID: 'com.sonny93.audio' },
								UUID: 'com.sonny93.audio.mute',
								Settings: {},
							},
						},
					},
				],
			}),
			buildJsonEntry('package.json', {
				RequiredPlugins: ['com.sonny93.audio', 'com.sonny93.beamng'],
			}),
		]);

		const directory = await importProfile({
			archiveFile,
			profilesDirectory,
			allowedPlugins: ALLOWED_PLUGINS,
		});

		const root: unknown = JSON.parse(
			await readFile(path.join(directory, MANIFEST_PATH), 'utf8')
		);
		const requirements: unknown = JSON.parse(
			await readFile(path.join(directory, 'package.json'), 'utf8')
		);
		expect(root).toMatchObject({ Pages: { Pages: ['third'] } });
		expect(requirements).toEqual({ RequiredPlugins: ['com.sonny93.audio'] });
		await expect(
			access(path.join(directory, OTHER_PAGE_PATH))
		).rejects.toThrow();
	});

	it('should write nothing when an entry path is unsafe', async () => {
		const archiveFile = await writeArchive([
			buildJsonEntry(MANIFEST_PATH, { Name: 'Deck' }),
			{ name: '../outside.txt', data: Buffer.from('x') },
		]);

		await expect(
			importProfile({
				archiveFile,
				profilesDirectory,
				allowedPlugins: ALLOWED_PLUGINS,
			})
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
			importProfile({
				archiveFile,
				profilesDirectory,
				allowedPlugins: ALLOWED_PLUGINS,
			})
		).rejects.toThrow();

		await expect(
			access(path.join(existingDirectory, 'keep.txt'))
		).resolves.toBeUndefined();
		expect(await readdir(profilesDirectory)).toEqual(['deck']);
	});
});
