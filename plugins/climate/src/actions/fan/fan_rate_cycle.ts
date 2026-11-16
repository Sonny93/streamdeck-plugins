import type { FanRate } from '../../daikin/unit_types';

/** The fan rates in order, from the quietest to the strongest. */
export const FanRateCycle: readonly FanRate[] = [
	'auto',
	'silent',
	1,
	2,
	3,
	4,
	5,
];
