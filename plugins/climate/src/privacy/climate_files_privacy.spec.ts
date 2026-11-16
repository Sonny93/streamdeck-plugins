import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import url from 'node:url';
import { describe, expect, it } from 'vitest';

import { findPrivacyLeaks } from './find_privacy_leaks';

const PLUGIN_DIRECTORY = url.fileURLToPath(new URL('../../', import.meta.url));
const PROFILES_DIRECTORY = path.resolve(PLUGIN_DIRECTORY, '../../profiles');
/** The one file allowed to hold private addresses: the examples of the address validation tests. */
const FIXTURES_FILE = path.join(
	PLUGIN_DIRECTORY,
	'src/unit_address/unit_address_fixtures.ts'
);
const SKIPPED_SEGMENTS = new Set(['node_modules', 'bin', 'logs']);
const BINARY_EXTENSIONS = new Set(['.png', '.jpg', '.ico', '.zip']);

function isScanned(file: string): boolean {
	const segments = file.split(path.sep);
	return (
		file !== FIXTURES_FILE &&
		!segments.some((segment) => SKIPPED_SEGMENTS.has(segment)) &&
		!BINARY_EXTENSIONS.has(path.extname(file).toLowerCase())
	);
}

function listFiles(directory: string): readonly string[] {
	return readdirSync(directory, { recursive: true, withFileTypes: true })
		.filter((entry) => entry.isFile())
		.map((entry) => path.join(entry.parentPath, entry.name))
		.filter(isScanned);
}

function listLeaks(directory: string): readonly string[] {
	return listFiles(directory).flatMap((file) =>
		findPrivacyLeaks(readFileSync(file, 'utf8')).map(
			(leak) => `${path.relative(PLUGIN_DIRECTORY, file)}: ${leak}`
		)
	);
}

describe('the files of the plugin and the committed profiles', () => {
	it('should hold no private network address and no MAC address in the plugin', () => {
		expect(listLeaks(PLUGIN_DIRECTORY)).toEqual([]);
	});

	it('should hold no private network address and no MAC address in the profiles', () => {
		expect(listLeaks(PROFILES_DIRECTORY)).toEqual([]);
	});

	it('should scan the sources of the plugin', () => {
		const scanned = listFiles(PLUGIN_DIRECTORY).map((file) =>
			path.relative(PLUGIN_DIRECTORY, file)
		);

		expect(scanned).toContain(path.join('src', 'plugin.ts'));
		expect(scanned).not.toContain(
			path.join('src', 'unit_address', 'unit_address_fixtures.ts')
		);
	});
});
