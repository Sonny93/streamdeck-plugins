const AFTER_COMMAND_FIELDS = /^\S+\s+(\d+)/;

/**
 * Reads the parent process id from the content of /proc/<pid>/stat.
 * The command name sits in parentheses and may hold spaces or parentheses itself, so the fields are read after the last `)`.
 */
export function parseProcessStat(stat: string): number | undefined {
	const commandEnd = stat.lastIndexOf(')');
	if (commandEnd === -1) {
		return undefined;
	}
	const match = AFTER_COMMAND_FIELDS.exec(stat.slice(commandEnd + 1).trim());
	return match?.[1] === undefined ? undefined : Number(match[1]);
}
