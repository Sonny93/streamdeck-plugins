import type { ControlPlacement } from './control_placement.ts';

/** Describes a profile: its identifiers, which are fixed so that builds are reproducible, and where each action sits. */
export type ProfileLayout = Readonly<{
	name: string;
	profileUuid: string;
	defaultPageUuid: string;
	contentPageUuid: string;
	keys: readonly ControlPlacement[];
	encoders: readonly ControlPlacement[];
}>;
