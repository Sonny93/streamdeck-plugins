import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { buildRestartCommand } from './build_restart_command.ts';
import { resolveOpenDeckPluginsDirectory } from './resolve_opendeck_plugins_directory.ts';
import { syncOpenDeckPlugin } from './sync_opendeck_plugin.ts';

const pluginUuid = process.argv[2];
if (!pluginUuid) {
	console.error('Usage: restart_plugin.ts <plugin-uuid>');
	process.exit(1);
}

const restartCommand = buildRestartCommand({
	platform: process.platform,
	pluginUuid,
});
if (!restartCommand) {
	console.log(
		`No Stream Deck host to restart ${pluginUuid} on ${process.platform}.`
	);
	process.exit(0);
}

if (process.platform === 'linux') {
	const pluginsDirectory = resolveOpenDeckPluginsDirectory({
		xdgConfigHome: process.env.XDG_CONFIG_HOME,
		homeDirectory: os.homedir(),
	});
	if (fs.existsSync(pluginsDirectory)) {
		try {
			const destination = syncOpenDeckPlugin({
				sourceDirectory: path.resolve(`${pluginUuid}.sdPlugin`),
				pluginsDirectory,
				pluginUuid,
			});
			console.log(`Copied ${pluginUuid} to ${destination}`);
		} catch (error) {
			console.error(error instanceof Error ? error.message : String(error));
			process.exit(1);
		}
	} else {
		console.log('OpenDeck is not installed: skipping the plugin copy.');
	}
}

const outcome = spawnSync(restartCommand.command, [...restartCommand.args], {
	stdio: 'inherit',
});
if (outcome.error) {
	console.error(outcome.error.message);
}
process.exit(outcome.status ?? 1);
