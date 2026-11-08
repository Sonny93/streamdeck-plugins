import { isRecord } from './is_record.ts';
import type { JsonRecord } from './profile_document.ts';

function filterController(
	options: Readonly<{
		controller: unknown;
		shouldKeep: (action: JsonRecord) => boolean;
	}>
): unknown {
	const { controller, shouldKeep } = options;
	if (!isRecord(controller) || !isRecord(controller['Actions'])) {
		return controller;
	}
	const kept = Object.entries(controller['Actions']).filter(
		([, action]) => !isRecord(action) || shouldKeep(action)
	);
	if (kept.length === Object.keys(controller['Actions']).length) {
		return controller;
	}
	return {
		...controller,
		Actions: kept.length === 0 ? null : Object.fromEntries(kept),
	};
}

/**
 * Drops the actions of a page manifest that `shouldKeep` rejects. A controller left without action gets `Actions: null`, as Stream Deck writes it.
 * The manifest itself is returned when nothing is dropped.
 */
export function filterPageActions(
	options: Readonly<{
		manifest: JsonRecord;
		shouldKeep: (action: JsonRecord) => boolean;
	}>
): JsonRecord {
	const { manifest, shouldKeep } = options;
	const controllers = manifest['Controllers'];
	if (!Array.isArray(controllers)) {
		return manifest;
	}
	const filtered = controllers.map((controller: unknown) =>
		filterController({ controller, shouldKeep })
	);
	if (
		filtered.every((controller, index) => controller === controllers[index])
	) {
		return manifest;
	}
	return { ...manifest, Controllers: filtered };
}
