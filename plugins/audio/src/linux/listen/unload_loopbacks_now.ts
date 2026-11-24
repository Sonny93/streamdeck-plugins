import { execFileSync } from 'node:child_process';

import { ListenSettings } from './listen_settings';

export type SyncCommandRunner = (
	command: string,
	args: readonly string[],
	options: Readonly<{ timeout: number }>
) => unknown;

const runSync: SyncCommandRunner = (command, args, options) =>
	execFileSync(command, [...args], { ...options, stdio: 'ignore' });

/** Unloads each module one after the other, synchronously, for the exit of the process; every failure is swallowed so the others still run. */
export function unloadLoopbacksNow(
	moduleIndexes: readonly number[],
	runCommandSync: SyncCommandRunner = runSync
): void {
	for (const moduleIndex of moduleIndexes) {
		try {
			runCommandSync('pactl', ['unload-module', String(moduleIndex)], {
				timeout: ListenSettings.exitUnloadTimeoutMilliseconds,
			});
		} catch {
			continue;
		}
	}
}
