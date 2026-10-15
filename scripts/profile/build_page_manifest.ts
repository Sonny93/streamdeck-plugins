import { ProfileFormat } from './profile_format.ts';
import type { PageManifest } from './page_manifest.ts';
import type { PluginManifest } from './plugin_manifest.ts';
import type { ControlPlacement } from './control_placement.ts';
import type { PlacedPageAction } from './placed_page_action.ts';
import { buildPageController } from './build_page_controller.ts';

/** Builds the `manifest.json` of a page holding the given keys (plus built-in folder keys) and dials. A controller with nothing placed gets null actions. */
export function buildPageManifest(
	options: Readonly<{
		keys: readonly ControlPlacement[];
		builtInKeys?: readonly PlacedPageAction[];
		encoders: readonly ControlPlacement[];
		manifest: PluginManifest;
	}>
): PageManifest {
	const { keys, builtInKeys, encoders, manifest } = options;
	return {
		Controllers: [
			buildPageController({
				type: ProfileFormat.keypadType,
				placements: keys,
				builtIns: builtInKeys,
				manifest,
			}),
			buildPageController({
				type: ProfileFormat.encoderType,
				placements: encoders,
				manifest,
			}),
		],
		Icon: '',
		Name: '',
	};
}
