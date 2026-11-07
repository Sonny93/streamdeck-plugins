import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { MissingBuildError } from './missing_build_error.ts';
import { packIconPack } from './pack_icon_pack.ts';

let workDirectory = '';

beforeEach(async () => {
	workDirectory = await mkdtemp(path.join(tmpdir(), 'release-tools-'));
});

afterEach(async () => {
	await rm(workDirectory, { recursive: true, force: true });
});

async function createIconPack(
	options: Readonly<{ isBuilt: boolean }>
): Promise<string> {
	const iconPackDirectory = path.join(workDirectory, 'keys.sdIconPack');
	await mkdir(iconPackDirectory, { recursive: true });
	await writeFile(
		path.join(iconPackDirectory, 'manifest.json'),
		'{\n\t"Version": "1.0.0"\n}\n'
	);
	if (options.isBuilt) {
		await writeFile(path.join(iconPackDirectory, 'icons.json'), '[]');
		await writeFile(path.join(iconPackDirectory, 'icon.png'), 'png');
	}
	return iconPackDirectory;
}

function buildOptions(iconPackDirectory: string): {
	iconPackDirectory: string;
	outputDirectory: string;
	stagingDirectory: string;
	version: string;
} {
	return {
		iconPackDirectory,
		outputDirectory: path.join(workDirectory, 'dist'),
		stagingDirectory: path.join(workDirectory, 'staging'),
		version: '2.0.1',
	};
}

describe('packIconPack', () => {
	it('should write an archive of the folder with the release version in its manifest and leave the source untouched', async () => {
		const iconPackDirectory = await createIconPack({ isBuilt: true });
		const options = buildOptions(iconPackDirectory);
		await mkdir(options.outputDirectory, { recursive: true });
		await mkdir(options.stagingDirectory, { recursive: true });

		const archiveFile = await packIconPack(options);

		const archive = (await readFile(archiveFile)).toString('latin1');
		expect(path.basename(archiveFile)).toBe('keys.streamDeckIconPack');
		expect(archive).toContain('keys.sdIconPack/manifest.json');
		expect(archive).toContain('"Version": "2.0.1"');
		expect(
			await readFile(path.join(iconPackDirectory, 'manifest.json'), 'utf8')
		).toContain('"Version": "1.0.0"');
	});

	it('should fail when the icon pack has not been built', async () => {
		const iconPackDirectory = await createIconPack({ isBuilt: false });

		await expect(packIconPack(buildOptions(iconPackDirectory))).rejects.toThrow(
			MissingBuildError
		);
	});
});
