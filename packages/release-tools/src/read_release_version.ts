import { parseReleaseVersion } from './parse_release_version.ts';
import { readRootVersion } from './read_root_version.ts';

/** Reads the one version of the repository from the root package.json, without its prerelease suffix. */
export async function readReleaseVersion(): Promise<string> {
	return parseReleaseVersion({ version: await readRootVersion() });
}
