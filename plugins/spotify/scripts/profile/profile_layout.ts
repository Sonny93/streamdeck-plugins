import type { ControlPlacement } from './control_placement.ts';
import type { ProfileFolder } from './profile_folder.ts';

/** Describes a profile: its identifiers, which are fixed so that builds are reproducible, where each action sits, and its folders. */
export type ProfileLayout = Readonly<{
	name: string;
	profileUuid: string;
	defaultPageUuid: string;
	contentPageUuid: string;
	keys: readonly ControlPlacement[];
	encoders: readonly ControlPlacement[];
	folders: readonly ProfileFolder[];
}>;
