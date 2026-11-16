import type { UnitState, WritableSpecialMode } from '../../daikin/unit_types';

/**
 * Whether a press should turn a special mode on (`true`) or off (`false`), from what the key shows.
 * `undefined` while the unit is off: the unit keeps no special mode then, so a press must not write one.
 */
export function resolveSpecialModeTarget(
	state: UnitState,
	mode: WritableSpecialMode
): boolean | undefined {
	if (!state.isPowered) {
		return undefined;
	}
	return !state.specialModes.includes(mode);
}
