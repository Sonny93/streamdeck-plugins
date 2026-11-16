import { CommandFailedError } from 'deck-kit/process/command_failed_error';
import type { CommandRunner } from 'deck-kit/process/run_command';

import type { ForegroundApp } from '../audio/foreground_app';
import type { ForegroundReadOptions } from '../audio/foreground_read_options';
import { KdotoolMissingError } from './kdotool_missing_error';
import { nodeProcFileSystem } from './node_proc_file_system';
import { parseKdotoolLines } from './parse_kdotool_lines';
import type { ProcFileSystem } from './proc_file_system';
import { resolveExecutableImageName } from './resolve_executable_image_name';
import { runKdotool } from './run_kdotool';

const CACHE_MILLISECONDS = 3000;

type ReaderOptions = Readonly<{
	onMissingKdotool: (error: unknown) => void;
	runCommand?: CommandRunner;
	procFileSystem?: ProcFileSystem;
	now?: () => number;
}>;

async function readActiveWindowApp(
	options: ReaderOptions
): Promise<ForegroundApp | undefined> {
	try {
		const output = await runKdotool({
			args: ['getactivewindow', 'getwindowpid'],
			runCommand: options.runCommand,
		});
		const processId = Number(parseKdotoolLines(output)[0]);
		if (!Number.isInteger(processId)) {
			return undefined;
		}
		const procFileSystem = options.procFileSystem ?? nodeProcFileSystem;
		const imageName = resolveExecutableImageName({
			executablePath: await procFileSystem.readProcessExecutable(processId),
			command: await procFileSystem.readProcessFile(processId, 'comm'),
		});
		return imageName === undefined ? undefined : { imageName, processId };
	} catch (error) {
		if (error instanceof KdotoolMissingError) {
			options.onMissingKdotool(error);
			return undefined;
		}
		if (error instanceof CommandFailedError) {
			return undefined;
		}
		throw error;
	}
}

/**
 * Builds the reader of the focused app: the active window's process through kdotool, then its executable name in /proc.
 * Each kdotool call loads a KWin script, and the volume dials ask every second, so the answer is cached for a few seconds and concurrent calls share it.
 * A fresh read skips the cache, which a volume change needs right after a focus change.
 * No active window, a failing kdotool or a missing one all read as `undefined`.
 */
export function createForegroundAppReader(
	options: ReaderOptions
): (readOptions?: ForegroundReadOptions) => Promise<ForegroundApp | undefined> {
	const now = options.now ?? Date.now;
	let cached:
		| Readonly<{ readAt: number; read: Promise<ForegroundApp | undefined> }>
		| undefined;
	return (readOptions) => {
		if (
			readOptions?.isFresh !== true &&
			cached !== undefined &&
			now() - cached.readAt < CACHE_MILLISECONDS
		) {
			return cached.read;
		}
		cached = { readAt: now(), read: readActiveWindowApp(options) };
		return cached.read;
	};
}
