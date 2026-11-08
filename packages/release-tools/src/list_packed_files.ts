import path from 'node:path';

import type { PackedProfile } from './packed_profile.ts';

/** Lists, without repeats, the absolute paths of the packed profile files that sit in a folder of the output directory (`.` for the directory itself). */
export function listPackedFiles(
	options: Readonly<{
		packedProfiles: readonly PackedProfile[];
		outputDirectory: string;
		folder: string;
	}>
): string[] {
	const files = options.packedProfiles
		.flatMap((profile) => profile.variants.map((variant) => variant.file))
		.filter((file) => path.posix.dirname(file) === options.folder);
	return [...new Set(files)].map((file) =>
		path.join(options.outputDirectory, file)
	);
}
