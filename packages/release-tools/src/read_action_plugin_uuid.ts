import { InvalidProfileError } from './invalid_profile_error.ts';
import { isRecord } from './is_record.ts';
import type { JsonRecord } from './profile_document.ts';

/** Reads the identifier of the plugin that owns an action. */
export function readActionPluginUuid(
	options: Readonly<{ action: JsonRecord }>
): string {
	const plugin = options.action['Plugin'];
	if (!isRecord(plugin) || typeof plugin['UUID'] !== 'string') {
		throw new InvalidProfileError({
			reason: 'A profile action has no Plugin.UUID',
		});
	}
	return plugin['UUID'];
}
