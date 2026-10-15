import type { ControlPlacement } from './control_placement.ts';

/**
 * A folder of a profile: the key that opens it (column, row, action id), the page it opens (with its own dials),
 * and the action id of its "parent folder" key, which the Stream Deck app keeps on the first key of the folder.
 */
export type ProfileFolder = Readonly<{
	column: number;
	row: number;
	actionId: string;
	pageUuid: string;
	backActionId: string;
	keys: readonly ControlPlacement[];
	encoders: readonly ControlPlacement[];
}>;
