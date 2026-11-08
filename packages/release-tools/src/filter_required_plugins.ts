import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { isRecord } from './is_record.ts';
import { ProfileActionUuids } from './profile_action_uuids.ts';
import { stringifyProfileJson } from './stringify_profile_json.ts';

const PACKAGE_FILE = 'package.json';

/** Drops from `RequiredPlugins`, in the `package.json` at the root of a profile folder, the plugins that are not allowed. */
export async function filterRequiredPlugins(
	options: Readonly<{
		profileDirectory: string;
		allowedPlugins: ReadonlySet<string>;
	}>
): Promise<void> {
	const file = path.join(options.profileDirectory, PACKAGE_FILE);
	const parsed: unknown = JSON.parse(await readFile(file, 'utf8'));
	if (!isRecord(parsed) || !Array.isArray(parsed['RequiredPlugins'])) {
		return;
	}
	const requiredPlugins = parsed['RequiredPlugins'].filter(
		(pluginUuid: unknown) =>
			typeof pluginUuid === 'string' &&
			(pluginUuid.startsWith(ProfileActionUuids.elgatoPrefix) ||
				options.allowedPlugins.has(pluginUuid))
	);
	await writeFile(
		file,
		stringifyProfileJson({ ...parsed, RequiredPlugins: requiredPlugins })
	);
}
