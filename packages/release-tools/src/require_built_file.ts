import { access } from 'node:fs/promises';

import { MissingBuildError } from './missing_build_error.ts';

/** Fails with a hint to build first when a file the release needs is missing. */
export async function requireBuiltFile(
	options: Readonly<{ filePath: string }>
): Promise<void> {
	try {
		await access(options.filePath);
	} catch {
		throw new MissingBuildError({
			reason: `${options.filePath} is missing, run pnpm build first`,
		});
	}
}
