import type { CommandRunner } from 'deck-kit/process/run_command';

import { parseKdotoolLines } from './parse_kdotool_lines';
import { runKdotool } from './run_kdotool';
import { WindowNotFoundError } from './window_not_found_error';

/**
 * Raises the first window of a process through kdotool (KWin script).
 * `--all` makes the pid filter the only one that applies: without it kdotool matches a window on any criterion, and an empty pattern matches every window.
 */
export async function activateProcessWindow(
	options: Readonly<{ processId: number; runCommand?: CommandRunner }>
): Promise<void> {
	const { processId, runCommand } = options;
	const output = await runKdotool({
		args: ['search', '--all', '--pid', String(processId)],
		runCommand,
	});
	const [windowId] = parseKdotoolLines(output);
	if (windowId === undefined) {
		throw new WindowNotFoundError({ processId });
	}
	await runKdotool({ args: ['windowactivate', windowId], runCommand });
}
