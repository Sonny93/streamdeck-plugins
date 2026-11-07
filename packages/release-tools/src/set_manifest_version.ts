import { ManifestVersionError } from './manifest_version_error.ts';

const VERSION_FIELD_PATTERN = /("Version"\s*:\s*)"[^"]*"/u;

/** Returns the manifest text with its `Version` replaced, leaving the rest of the text, indentation included, untouched. */
export function setManifestVersion(
	options: Readonly<{ manifestText: string; version: string }>
): string {
	const { manifestText, version } = options;
	if (!VERSION_FIELD_PATTERN.test(manifestText)) {
		throw new ManifestVersionError({
			reason: 'The manifest has no "Version" field',
		});
	}
	return manifestText.replace(
		VERSION_FIELD_PATTERN,
		(_match, prefix: string) => `${prefix}"${version}"`
	);
}
