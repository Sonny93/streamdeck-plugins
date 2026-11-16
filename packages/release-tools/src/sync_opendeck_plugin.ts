import fs from 'node:fs';
import path from 'node:path';

import { InvalidPluginUuidError } from './invalid_plugin_uuid_error.ts';
import { MissingPluginSourceError } from './missing_plugin_source_error.ts';

const PLUGIN_UUID_PATTERN = /^com\.sonny93\.[a-z0-9-]+$/;
const LOGS_FOLDER_NAME = 'logs';

function assertValidSource(sourceDirectory: string): void {
	if (!fs.existsSync(path.join(sourceDirectory, 'manifest.json'))) {
		throw new MissingPluginSourceError({ sourceDirectory });
	}
}

function lstatOrUndefined(target: string): fs.Stats | undefined {
	try {
		return fs.lstatSync(target);
	} catch (error) {
		if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
			return undefined;
		}
		throw error;
	}
}

function emptyDirectoryKeepingLogs(directory: string): void {
	for (const entry of fs.readdirSync(directory)) {
		if (entry === LOGS_FOLDER_NAME) {
			continue;
		}
		fs.rmSync(path.join(directory, entry), { recursive: true, force: true });
	}
}

function prepareDestination(destination: string): void {
	const stats = lstatOrUndefined(destination);
	if (stats?.isSymbolicLink()) {
		fs.unlinkSync(destination);
	} else if (stats?.isDirectory()) {
		emptyDirectoryKeepingLogs(destination);
		return;
	} else if (stats) {
		fs.rmSync(destination, { force: true });
	}
	fs.mkdirSync(destination, { recursive: true });
}

function copySource(sourceDirectory: string, destination: string): void {
	const sourceLogsDirectory = path.join(sourceDirectory, LOGS_FOLDER_NAME);
	fs.cpSync(sourceDirectory, destination, {
		recursive: true,
		dereference: true,
		filter: (sourcePath) => sourcePath !== sourceLogsDirectory,
	});
}

/** Copies a built plugin folder into the OpenDeck plugins folder, replacing a link or stale files and keeping its `logs` folder. Returns the destination. */
export function syncOpenDeckPlugin(
	options: Readonly<{
		sourceDirectory: string;
		pluginsDirectory: string;
		pluginUuid: string;
	}>
): string {
	if (!PLUGIN_UUID_PATTERN.test(options.pluginUuid)) {
		throw new InvalidPluginUuidError({ pluginUuid: options.pluginUuid });
	}
	assertValidSource(options.sourceDirectory);
	const destination = path.join(
		options.pluginsDirectory,
		`${options.pluginUuid}.sdPlugin`
	);
	prepareDestination(destination);
	copySource(options.sourceDirectory, destination);
	return destination;
}
