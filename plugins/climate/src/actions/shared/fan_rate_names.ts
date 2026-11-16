import type { FanRate } from '../../daikin/unit_types';

/** How the fan rates are named on the keys. */
export const FanRateNames: Readonly<Record<FanRate, string>> = {
	auto: 'Auto',
	silent: 'Silence',
	1: '1',
	2: '2',
	3: '3',
	4: '4',
	5: '5',
};
