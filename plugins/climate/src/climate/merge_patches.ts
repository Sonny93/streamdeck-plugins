import type { DesiredUnitState } from '../daikin/unit_types';

/** Merges two patches, the latest value of each field winning; a field left `undefined` in the later patch keeps the earlier value. */
export function mergePatches(
	earlier: Readonly<DesiredUnitState>,
	later: Readonly<DesiredUnitState>
): DesiredUnitState {
	const definedFields = Object.entries(later).filter(
		([, value]) => value !== undefined
	);
	return { ...earlier, ...Object.fromEntries(definedFields) };
}
