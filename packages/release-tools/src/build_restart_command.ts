const POWERSHELL_ARGUMENTS = [
	'-NoProfile',
	'-ExecutionPolicy',
	'Bypass',
	'-File',
	'scripts/restart_plugin.ps1',
] as const;

export type RestartCommand = Readonly<{
	command: string;
	args: readonly string[];
}>;

/** Picks the command that restarts a plugin on a platform, or undefined when the platform has no Stream Deck host to restart it. */
export function buildRestartCommand(
	options: Readonly<{ platform: NodeJS.Platform; pluginUuid: string }>
): RestartCommand | undefined {
	if (options.platform === 'win32') {
		return { command: 'powershell', args: POWERSHELL_ARGUMENTS };
	}
	if (options.platform === 'linux') {
		return {
			command: 'opendeck',
			args: ['--reload-plugin', `${options.pluginUuid}.sdPlugin`],
		};
	}
	return undefined;
}
