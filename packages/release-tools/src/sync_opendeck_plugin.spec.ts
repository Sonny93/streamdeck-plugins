import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { InvalidPluginUuidError } from './invalid_plugin_uuid_error.ts';
import { MissingPluginSourceError } from './missing_plugin_source_error.ts';
import { syncOpenDeckPlugin } from './sync_opendeck_plugin.ts';

const PLUGIN_UUID = 'com.sonny93.sample';

let root: string;
let sourceDirectory: string;
let pluginsDirectory: string;
let destination: string;

function writeFile(filePath: string, content: string): void {
	fs.mkdirSync(path.dirname(filePath), { recursive: true });
	fs.writeFileSync(filePath, content);
}

function sync(pluginUuid = PLUGIN_UUID): string {
	return syncOpenDeckPlugin({ sourceDirectory, pluginsDirectory, pluginUuid });
}

beforeEach(() => {
	root = fs.mkdtempSync(path.join(os.tmpdir(), 'sync-opendeck-'));
	sourceDirectory = path.join(root, 'source');
	pluginsDirectory = path.join(root, 'plugins');
	destination = path.join(pluginsDirectory, `${PLUGIN_UUID}.sdPlugin`);
	fs.mkdirSync(pluginsDirectory);
	writeFile(path.join(sourceDirectory, 'manifest.json'), '{}');
});

afterEach(() => {
	fs.rmSync(root, { recursive: true, force: true });
});

describe('syncOpenDeckPlugin', () => {
	it('should copy files and nested folders to the destination', () => {
		writeFile(path.join(sourceDirectory, 'bin', 'deep', 'plugin.js'), 'code');

		const returned = sync();

		expect(returned).toBe(destination);
		expect(
			fs.readFileSync(path.join(destination, 'manifest.json'), 'utf8')
		).toBe('{}');
		expect(
			fs.readFileSync(
				path.join(destination, 'bin', 'deep', 'plugin.js'),
				'utf8'
			)
		).toBe('code');
	});

	it('should not copy the source logs folder', () => {
		writeFile(path.join(sourceDirectory, 'logs', 'run.log'), 'source log');

		sync();

		expect(fs.existsSync(path.join(destination, 'logs'))).toBe(false);
	});

	it('should keep the destination logs folder when syncing', () => {
		writeFile(path.join(destination, 'logs', 'run.log'), 'kept log');

		sync();

		expect(
			fs.readFileSync(path.join(destination, 'logs', 'run.log'), 'utf8')
		).toBe('kept log');
	});

	it('should remove stale files from the destination', () => {
		writeFile(path.join(destination, 'old', 'stale.js'), 'stale');
		writeFile(path.join(destination, 'stale.txt'), 'stale');

		sync();

		expect(fs.existsSync(path.join(destination, 'old'))).toBe(false);
		expect(fs.existsSync(path.join(destination, 'stale.txt'))).toBe(false);
	});

	it('should replace a destination symlink without touching its target', () => {
		const linkTarget = path.join(root, 'link-target');
		writeFile(path.join(linkTarget, 'keep.txt'), 'intact');
		fs.symlinkSync(linkTarget, destination);

		sync();

		expect(fs.lstatSync(destination).isSymbolicLink()).toBe(false);
		expect(fs.readFileSync(path.join(linkTarget, 'keep.txt'), 'utf8')).toBe(
			'intact'
		);
		expect(fs.existsSync(path.join(linkTarget, 'manifest.json'))).toBe(false);
	});

	it('should reject an invalid plugin uuid', () => {
		expect(() => sync('../evil')).toThrow(InvalidPluginUuidError);
	});

	it('should reject a missing source', () => {
		fs.rmSync(sourceDirectory, { recursive: true });

		expect(() => sync()).toThrow(MissingPluginSourceError);
	});
});
