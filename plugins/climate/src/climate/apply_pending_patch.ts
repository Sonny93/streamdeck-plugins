import type { DesiredUnitState, UnitState } from '../daikin/unit_types';

/**
 * The state a unit will show once a patch is written. A mode change without a temperature leaves the target temperature
 * unknown (`null`) until the write returns, because the unit then applies the setpoint it memorized for that mode.
 */
export function applyPendingPatch(
	state: UnitState,
	patch: Readonly<DesiredUnitState>
): UnitState {
	const isModeChanging = patch.mode !== undefined && patch.mode !== state.mode;
	const keptTemperature = isModeChanging ? null : state.targetTemperature;
	return {
		...state,
		isPowered: patch.isPowered ?? state.isPowered,
		mode: patch.mode ?? state.mode,
		targetTemperature:
			patch.targetTemperature === undefined
				? keptTemperature
				: patch.targetTemperature,
		fanRate: patch.fanRate ?? state.fanRate,
		fanDirection: patch.fanDirection ?? state.fanDirection,
	};
}
