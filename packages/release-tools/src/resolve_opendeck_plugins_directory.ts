import path from 'node:path';

/** Resolves the folder OpenDeck loads plugins from: `$XDG_CONFIG_HOME/opendeck/plugins`, else `~/.config/opendeck/plugins`. */
export function resolveOpenDeckPluginsDirectory(
	options: Readonly<{
		xdgConfigHome: string | undefined;
		homeDirectory: string;
	}>
): string {
	const configDirectory = options.xdgConfigHome?.length
		? options.xdgConfigHome
		: path.join(options.homeDirectory, '.config');
	return path.join(configDirectory, 'opendeck', 'plugins');
}
