import type { PageAction } from './page_action.ts';
import type { PluginManifest } from './plugin_manifest.ts';
import type { ControlPlacement } from './control_placement.ts';
import { UnknownActionError } from './unknown_action_error.ts';

/** Builds the page entry of a placed action from its declaration in the plugin manifest, and fails when the manifest does not declare it. */
export function buildPageAction(
	options: Readonly<{ placement: ControlPlacement; manifest: PluginManifest }>
): PageAction {
	const { placement, manifest } = options;
	const action = manifest.actions.find(
		(candidate) => candidate.uuid === placement.actionUuid
	);
	if (action === undefined) {
		throw new UnknownActionError({ actionUuid: placement.actionUuid });
	}
	return {
		ActionID: placement.actionId,
		LinkedTitle: true,
		Name: action.name,
		Plugin: {
			Name: manifest.name,
			UUID: manifest.uuid,
			Version: manifest.version,
		},
		Resources: null,
		Settings: {},
		State: 0,
		States: Array.from({ length: action.stateCount }, () => ({})),
		UUID: action.uuid,
	};
}
