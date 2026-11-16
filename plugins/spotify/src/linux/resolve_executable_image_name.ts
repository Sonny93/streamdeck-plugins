import path from 'node:path';

const DELETED_SUFFIX = / \(deleted\)$/;
const WINE_PRELOADER = /^wine(?:64)?-preloader$/;

/**
 * Names a process after its executable file, not its `comm`, which a program can rename (`===>>> BeamNGMa`).
 * A Wine or Proton game runs under the generic `wine64-preloader`, so there the `comm` is the better name; the caller matches such a process by id.
 * Falls back to the `comm` when the executable cannot be read.
 */
export function resolveExecutableImageName(
	options: Readonly<{
		executablePath: string | undefined;
		command: string | undefined;
	}>
): string | undefined {
	const command = options.command?.trim();
	const executableName =
		options.executablePath === undefined
			? ''
			: path.posix.basename(options.executablePath.replace(DELETED_SUFFIX, ''));
	if (executableName === '' || WINE_PRELOADER.test(executableName)) {
		return command === '' ? undefined : command;
	}
	return executableName;
}
