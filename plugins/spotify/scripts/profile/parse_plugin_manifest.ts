import { isRecord } from './is_record.ts';
import type { PluginManifest } from './plugin_manifest.ts';
import { PluginManifestError } from './plugin_manifest_error.ts';
import { parseManifestAction } from './parse_manifest_action.ts';

/** Reads the parsed plugin manifest JSON, and fails when its name, UUID, version or actions are missing. */
export function parsePluginManifest(raw: unknown): PluginManifest {
	if (!isRecord(raw)) {
		throw new PluginManifestError({ reason: 'the root is not an object' });
	}
	const { Name: name, UUID: uuid, Version: version, Actions: actions } = raw;
	if (
		typeof name !== 'string' ||
		typeof uuid !== 'string' ||
		typeof version !== 'string'
	) {
		throw new PluginManifestError({
			reason: 'no string "Name", "UUID" or "Version"',
		});
	}
	if (!Array.isArray(actions)) {
		throw new PluginManifestError({ reason: 'no "Actions" array' });
	}
	return {
		name,
		uuid,
		version,
		actions: actions.map((action: unknown) => parseManifestAction(action)),
	};
}
