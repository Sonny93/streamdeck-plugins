import { parseReleaseVersion } from './parse_release_version.ts';
import { readRootVersion } from './read_root_version.ts';

/** Reads the version of the root package.json with its prerelease suffix, such as `1.0.0-next.0`, after checking it is a valid release version. */
export async function readFullReleaseVersion(): Promise<string> {
	const version = await readRootVersion();
	parseReleaseVersion({ version });
	return String(version);
}
