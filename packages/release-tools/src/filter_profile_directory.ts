import { filterProfile } from './filter_profile.ts';
import { filterRequiredPlugins } from './filter_required_plugins.ts';
import { readProfileDirectory } from './read_profile_directory.ts';
import { writeProfileDirectory } from './write_profile_directory.ts';

/** Applies the profile filter in place to a `profiles/<name>`-shaped folder: manifests, page folders and `RequiredPlugins`. */
export async function filterProfileDirectory(
	options: Readonly<{
		profileDirectory: string;
		allowedPlugins: ReadonlySet<string>;
	}>
): Promise<void> {
	const { profileDirectory, allowedPlugins } = options;
	const original = await readProfileDirectory({ profileDirectory });
	const filtered = filterProfile({
		document: original.document,
		allowedPlugins,
	});
	await writeProfileDirectory({ original, filtered });
	await filterRequiredPlugins({ profileDirectory, allowedPlugins });
}
