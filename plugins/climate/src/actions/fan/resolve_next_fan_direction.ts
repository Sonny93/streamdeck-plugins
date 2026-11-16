import type { FanDirection } from '../../daikin/unit_types';

/** The swing a press goes to: fixed while the unit swings in any direction, both directions while it is fixed. */
export function resolveNextFanDirection(current: FanDirection): FanDirection {
	return current === 'fixed' ? 'both' : 'fixed';
}
