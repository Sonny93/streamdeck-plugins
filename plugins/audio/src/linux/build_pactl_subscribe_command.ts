export type PactlSubscribeCommand = Readonly<{
	command: string;
	args: readonly string[];
}>;

/**
 * The command that runs `pactl subscribe`. Through `setpriv --pdeathsig TERM` (util-linux) the kernel
 * terminates it with its parent, so a plugin killed by SIGKILL leaves no process behind.
 */
export function buildPactlSubscribeCommand(
	isParentDeathSignalWanted: boolean
): PactlSubscribeCommand {
	return isParentDeathSignalWanted
		? {
				command: 'setpriv',
				args: ['--pdeathsig', 'TERM', '--', 'pactl', 'subscribe'],
			}
		: { command: 'pactl', args: ['subscribe'] };
}
