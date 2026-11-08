import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { buildTestAction } from './build_test_action.ts';
import { buildTestPage } from './build_test_page.ts';
import { packProfileVariants } from './pack_profile_variants.ts';
import { readZip } from './read_zip.ts';
import { stringifyProfileJson } from './stringify_profile_json.ts';

const AUDIO = 'com.sonny93.audio';
const SPOTIFY = 'com.sonny93.spotify';
const SD_PROFILE = 'Profiles/AAA.sdProfile';

let workDirectory = '';

beforeEach(async () => {
	workDirectory = await mkdtemp(path.join(tmpdir(), 'release-tools-'));
});

afterEach(async () => {
	await rm(workDirectory, { recursive: true, force: true });
});

async function writeJson(relativePath: string, value: unknown): Promise<void> {
	const file = path.join(workDirectory, 'profiles', 'deck', relativePath);
	await mkdir(path.dirname(file), { recursive: true });
	await writeFile(file, stringifyProfileJson(value));
}

async function writeDeckProfile(): Promise<string> {
	await writeJson(`${SD_PROFILE}/manifest.json`, {
		Name: 'Deck',
		Pages: {
			Current: '00000000-0000-0000-0000-000000000000',
			Default: 'main',
			Pages: [],
		},
	});
	await writeJson(
		`${SD_PROFILE}/Profiles/MAIN/manifest.json`,
		buildTestPage({
			keys: {
				'0,0': buildTestAction({ pluginUuid: AUDIO }),
				'1,0': buildTestAction({ pluginUuid: SPOTIFY }),
			},
		})
	);
	await writeJson('package.json', { RequiredPlugins: [AUDIO, SPOTIFY] });
	return path.join(workDirectory, 'profiles', 'deck');
}

describe('packProfileVariants', () => {
	it('should pack the whole set beside a variant for each smaller combination and describe them for the index', async () => {
		const outputDirectory = path.join(workDirectory, 'dist');
		await mkdir(outputDirectory, { recursive: true });

		const packed = await packProfileVariants({
			profileDirectory: await writeDeckProfile(),
			workspacePlugins: new Set([AUDIO, SPOTIFY, 'com.sonny93.display']),
			outputDirectory,
			stagingDirectory: path.join(workDirectory, 'staging'),
		});

		expect(packed).toEqual({
			name: 'Deck',
			variants: [
				{ plugins: [AUDIO, SPOTIFY], file: 'deck.streamDeckProfile' },
				{ plugins: [AUDIO], file: 'variants/deck--audio.streamDeckProfile' },
				{
					plugins: [SPOTIFY],
					file: 'variants/deck--spotify.streamDeckProfile',
				},
			],
		});
		const audioOnly = readZip({
			archive: await readFile(
				path.join(outputDirectory, 'variants/deck--audio.streamDeckProfile')
			),
		});
		const requirements = audioOnly.find(
			(entry) => entry.name === 'package.json'
		);
		expect(
			JSON.parse(Buffer.from(requirements?.data ?? []).toString())
		).toEqual({
			RequiredPlugins: [AUDIO],
		});
	});
});
