import path from 'node:path';

const DEFAULT_SYSTEM_ROOT = 'C:\\Windows';

/** Full path of a tool of the System32 folder, so no shell and no PATH lookup is involved. */
export function resolveSystemToolPath(
	toolName: string,
	environment: Readonly<Record<string, string | undefined>> = process.env
): string {
	const systemRoot = environment['SystemRoot'] ?? DEFAULT_SYSTEM_ROOT;
	return path.win32.join(systemRoot, 'System32', toolName);
}
