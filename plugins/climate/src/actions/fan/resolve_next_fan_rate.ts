import type { FanRate } from '../../daikin/unit_types';
import { FanRateCycle } from './fan_rate_cycle';

/** The fan rate a press goes to: the one after the displayed rate in the cycle auto, silent, 1 to 5, back to auto after 5. */
export function resolveNextFanRate(current: FanRate): FanRate {
	const index = FanRateCycle.indexOf(current);
	return FanRateCycle[(index + 1) % FanRateCycle.length] ?? 'auto';
}
