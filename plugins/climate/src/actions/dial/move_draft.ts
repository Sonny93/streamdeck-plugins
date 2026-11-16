import { SETPOINT_RANGES } from '../../daikin/local/setpoint_ranges';
import type { UnitState } from '../../daikin/unit_types';
import type { DialDraft } from './dial_draft';

/**
 * The draft after a rotation: the draft moved by the ticks, or the displayed target moved by them when there is no draft
 * for the displayed mode. The result is kept in the range of the displayed mode.
 * `undefined` when there is nothing to choose: the mode has no setpoint (dry, fan) or the displayed target is unknown
 * (right after a mode change).
 */
export function moveDraft(
	options: Readonly<{
		draft: DialDraft | undefined;
		state: UnitState;
		ticks: number;
		step: number;
	}>
): DialDraft | undefined {
	const { draft, state, ticks, step } = options;
	const range = SETPOINT_RANGES[state.mode];
	const base =
		draft?.mode === state.mode ? draft.temperature : state.targetTemperature;
	if (range === undefined || base === null) {
		return undefined;
	}
	const moved = base + ticks * step;
	return {
		temperature: Math.min(Math.max(moved, range.minimum), range.maximum),
		mode: state.mode,
	};
}
