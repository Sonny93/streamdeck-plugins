import { BuiltInActions } from './built_in_actions.ts';
import type { PageAction } from './page_action.ts';

/** Builds the "parent folder" key that leaves a folder. */
export function buildBackToParentAction(actionId: string): PageAction {
	const { backToParent, version } = BuiltInActions;
	return {
		ActionID: actionId,
		LinkedTitle: true,
		Name: backToParent.name,
		Plugin: {
			Name: backToParent.pluginName,
			UUID: backToParent.uuid,
			Version: version,
		},
		Resources: null,
		Settings: {},
		State: 0,
		States: [{}],
		UUID: backToParent.uuid,
	};
}
