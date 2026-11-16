import type { FanRate } from '../../daikin/unit_types';
import { FanRateCycle } from '../fan/fan_rate_cycle';

/** The fan rate a rotation goes to: the displayed rate moved by the ticks through the ordered rates, stopping at both ends without wrapping. */
export function resolveFanRateByTicks(
	current: FanRate,
	ticks: number
): FanRate {
	const lastIndex = FanRateCycle.length - 1;
	const moved = Math.max(0, FanRateCycle.indexOf(current)) + ticks;
	return FanRateCycle[Math.min(Math.max(moved, 0), lastIndex)] ?? current;
}
