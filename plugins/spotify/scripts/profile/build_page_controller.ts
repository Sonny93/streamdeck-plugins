import { buildPageAction } from './build_page_action.ts';
import type { ControlPlacement } from './control_placement.ts';
import type { PageAction } from './page_action.ts';
import type { PageController } from './page_controller.ts';
import type { PlacedPageAction } from './placed_page_action.ts';
import type { PluginManifest } from './plugin_manifest.ts';

/**
 * Builds the controller entry of a page, keyed by "column,row" in the order the Stream Deck app writes, or with no actions when nothing is placed.
 * Plugin actions are built from the manifest; `builtIns` (folder keys) are added as they are.
 */
export function buildPageController(
	options: Readonly<{
		type: string;
		placements: readonly ControlPlacement[];
		builtIns?: readonly PlacedPageAction[];
		manifest: PluginManifest;
	}>
): PageController {
	const { type, placements, builtIns = [], manifest } = options;
	if (placements.length === 0 && builtIns.length === 0) {
		return { Actions: null, Type: type };
	}
	const entries: [string, PageAction][] = [
		...placements.map((placement): [string, PageAction] => [
			`${placement.column},${placement.row}`,
			buildPageAction({ placement, manifest }),
		]),
		...builtIns.map((placed): [string, PageAction] => [
			`${placed.column},${placed.row}`,
			placed.action,
		]),
	];
	entries.sort(
		([left], [right]) => Number(left > right) - Number(left < right)
	);
	return { Actions: Object.fromEntries(entries), Type: type };
}
