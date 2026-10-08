import { ProfileFormat } from './profile_format.ts';
import type { PageManifest } from './page_manifest.ts';
import type { PluginManifest } from './plugin_manifest.ts';
import type { ControlPlacement } from './control_placement.ts';
import { buildPageController } from './build_page_controller.ts';

/** Builds the `manifest.json` of a page holding the given keys and dials. A page with no placement gets null actions. */
export function buildPageManifest(
	options: Readonly<{
		keys: readonly ControlPlacement[];
		encoders: readonly ControlPlacement[];
		manifest: PluginManifest;
	}>
): PageManifest {
	const { keys, encoders, manifest } = options;
	return {
		Controllers: [
			buildPageController({
				type: ProfileFormat.keypadType,
				placements: keys,
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
