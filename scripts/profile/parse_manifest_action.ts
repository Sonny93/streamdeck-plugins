import { isRecord } from './is_record.ts';
import type { ManifestAction } from './manifest_action.ts';
import { PluginManifestError } from './plugin_manifest_error.ts';

/** Reads one entry of the manifest "Actions" array, and fails when its name, UUID or states are missing. */
export function parseManifestAction(raw: unknown): ManifestAction {
	if (!isRecord(raw)) {
		throw new PluginManifestError({ reason: 'an action is not an object' });
	}
	const { Name: name, UUID: uuid, States: states } = raw;
	if (typeof name !== 'string' || typeof uuid !== 'string') {
		throw new PluginManifestError({
			reason: 'an action has no string "Name" or "UUID"',
		});
	}
	if (!Array.isArray(states)) {
		throw new PluginManifestError({
			reason: `the action "${uuid}" has no "States" array`,
		});
	}
	return { name, uuid, stateCount: states.length };
}
