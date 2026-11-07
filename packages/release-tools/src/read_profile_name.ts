import { InvalidProfileError } from './invalid_profile_error.ts';
import type { ZipEntry } from './zip/zip_entry.ts';

const PROFILE_MANIFEST_PATH = /^Profiles\/[^/]+\.sdProfile\/manifest\.json$/u;

/** Reads the profile `Name` from the manifest of the `.sdProfile` folder of an exported archive. */
export function readProfileName(
	options: Readonly<{ entries: readonly ZipEntry[] }>
): string {
	const manifestEntry = options.entries.find((entry) =>
		PROFILE_MANIFEST_PATH.test(entry.name)
	);
	if (manifestEntry === undefined) {
		throw new InvalidProfileError({
			reason: 'The archive has no Profiles/<uuid>.sdProfile/manifest.json',
		});
	}
	const manifest: unknown = JSON.parse(
		Buffer.from(manifestEntry.data).toString('utf8')
	);
	const name: unknown =
		typeof manifest === 'object' && manifest !== null
			? Reflect.get(manifest, 'Name')
			: undefined;
	if (typeof name !== 'string') {
		throw new InvalidProfileError({
			reason: 'The profile manifest has no Name',
		});
	}
	return name;
}
