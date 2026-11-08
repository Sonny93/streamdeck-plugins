import type { JsonRecord } from './profile_document.ts';

/** Builds an action of a plugin, for tests. */
export function buildTestAction(
	options: Readonly<{ pluginUuid: string; uuid?: string }>
): JsonRecord {
	return {
		Name: options.pluginUuid,
		Plugin: { UUID: options.pluginUuid },
		Settings: {},
		UUID: options.uuid ?? `${options.pluginUuid}.action`,
	};
}
