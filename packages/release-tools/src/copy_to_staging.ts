import { cp } from 'node:fs/promises';
import path from 'node:path';

/** Copies a folder into the staging directory and returns the path of the copy, so packing never touches the source tree. */
export async function copyToStaging(
	options: Readonly<{ source: string; stagingDirectory: string }>
): Promise<string> {
	const destination = path.join(
		options.stagingDirectory,
		path.basename(options.source)
	);
	await cp(options.source, destination, { recursive: true });
	return destination;
}
