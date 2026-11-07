import { InvalidReleaseVersionError } from './invalid_release_version_error.ts';

const RELEASE_VERSION_PATTERN =
	/^(?<base>\d+\.\d+\.\d+)(?:-[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/u;

/**
 * Returns the base `X.Y.Z` of a version that is `X.Y.Z` or `X.Y.Z-<prerelease>`, and fails otherwise.
 * A manifest version has numeric parts only, so a prerelease ships files versioned like its base.
 */
export function parseReleaseVersion(
	options: Readonly<{ version: unknown }>
): string {
	const { version } = options;
	const base =
		typeof version === 'string'
			? RELEASE_VERSION_PATTERN.exec(version)?.groups?.['base']
			: undefined;
	if (base === undefined) {
		throw new InvalidReleaseVersionError({
			reason: `The version of the root package.json must be X.Y.Z or X.Y.Z-<prerelease>, got ${JSON.stringify(version)}`,
		});
	}
	return base;
}
