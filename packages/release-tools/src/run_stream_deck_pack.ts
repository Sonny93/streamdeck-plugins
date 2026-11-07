import { execFile } from 'node:child_process';
import { createRequire } from 'node:module';
import path from 'node:path';
import { promisify } from 'node:util';

import { PackCommandError } from './pack_command_error.ts';
import { ReleaseFormats } from './release_formats.ts';

const execFileAsync = promisify(execFile);

function resolveCliBin(options: Readonly<{ pluginDirectory: string }>): string {
	return createRequire(
		path.join(options.pluginDirectory, 'package.json')
	).resolve(ReleaseFormats.cliBinSpecifier);
}

/**
 * Runs the Elgato CLI of the plugin on a staged copy of its folder and writes `<uuid>.streamDeckPlugin` into the output directory.
 * The CLI writes the version into the manifest it packs, which is why the copy is packed and not the source.
 */
export async function runStreamDeckPack(
	options: Readonly<{
		pluginDirectory: string;
		stagedDirectory: string;
		outputDirectory: string;
		version: string;
	}>
): Promise<void> {
	const { pluginDirectory, stagedDirectory, outputDirectory, version } =
		options;
	try {
		await execFileAsync(process.execPath, [
			resolveCliBin({ pluginDirectory }),
			'pack',
			stagedDirectory,
			'--output',
			outputDirectory,
			'--force',
			'--no-update-check',
			'--no-file-list',
			'--version',
			version,
		]);
	} catch (cause) {
		throw new PackCommandError({
			reason: `The Stream Deck CLI failed to pack ${stagedDirectory}: ${String(cause)}`,
		});
	}
}
