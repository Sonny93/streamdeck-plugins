import { isRecord } from './is_record.ts';
import type { JsonRecord } from './profile_document.ts';

/** Lists the actions (keys and dials) of a page manifest, whatever their position. */
export function listPageActions(
	options: Readonly<{ manifest: JsonRecord }>
): JsonRecord[] {
	const controllers = options.manifest['Controllers'];
	if (!Array.isArray(controllers)) {
		return [];
	}
	return controllers
		.filter(isRecord)
		.map((controller) => controller['Actions'])
		.filter(isRecord)
		.flatMap((actions) => Object.values(actions).filter(isRecord));
}
