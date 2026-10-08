import type { PageAction } from './page_action.ts';
import { buildPageAction } from './build_page_action.ts';
import type { PageController } from './page_controller.ts';
import type { PluginManifest } from './plugin_manifest.ts';
import type { ControlPlacement } from './control_placement.ts';

/** Builds the controller entry of a page, keyed by "column,row" in the order the Stream Deck app writes, or with no actions when nothing is placed. */
export function buildPageController(
	options: Readonly<{
		type: string;
		placements: readonly ControlPlacement[];
		manifest: PluginManifest;
	}>
): PageController {
	const { type, placements, manifest } = options;
	if (placements.length === 0) {
		return { Actions: null, Type: type };
	}
	const entries: [string, PageAction][] = placements.map((placement) => [
		`${placement.column},${placement.row}`,
		buildPageAction({ placement, manifest }),
	]);
	entries.sort(
		([left], [right]) => Number(left > right) - Number(left < right)
	);
	return { Actions: Object.fromEntries(entries), Type: type };
}
