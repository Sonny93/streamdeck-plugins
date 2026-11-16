import { spawn, type ChildProcess } from 'node:child_process';
import { createInterface } from 'node:readline';

import { buildPactlSubscribeCommand } from './build_pactl_subscribe_command';
import { readErrorCode } from './read_error_code';
import type { SpawnPactlSubscribeOptions } from './spawn_pactl_subscribe_options';

/**
 * Starts `pactl subscribe` without a shell and returns the function that kills it; it reports the end of the process once.
 * It starts under `setpriv` so it dies with the plugin, and falls back to plain `pactl` when `setpriv` is not installed.
 */
export function spawnPactlSubscribe(
	options: SpawnPactlSubscribeOptions
): () => void {
	let child: ChildProcess | undefined;
	let hasEnded = false;
	const end = (): void => {
		if (hasEnded) {
			return;
		}
		hasEnded = true;
		options.onExit();
	};
	const start = (isParentDeathSignalWanted: boolean): void => {
		const { command, args } = buildPactlSubscribeCommand(
			isParentDeathSignalWanted
		);
		const started = spawn(command, [...args], {
			stdio: ['ignore', 'pipe', 'ignore'],
			env: { ...process.env, LC_ALL: 'C' },
		});
		child = started;
		createInterface({ input: started.stdout }).on('line', options.onLine);
		started.once('error', (error) => {
			if (isParentDeathSignalWanted && readErrorCode(error) === 'ENOENT') {
				start(false);
				return;
			}
			end();
		});
		started.once('exit', end);
	};
	start(true);
	return () => {
		child?.kill();
	};
}
