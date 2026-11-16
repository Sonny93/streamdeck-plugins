import type {
	FanDirection,
	FanRate,
	SpecialMode,
	UnitMode,
	WritableSpecialMode,
} from '../unit_types';

function invert<TKey, TValue>(
	table: ReadonlyMap<TKey, TValue>
): ReadonlyMap<TValue, TKey> {
	return new Map([...table].map(([key, value]) => [value, key]));
}

const FAN_RATE_BY_RAW: ReadonlyMap<string, FanRate> = new Map<string, FanRate>([
	['A', 'auto'],
	['B', 'silent'],
	['3', 1],
	['4', 2],
	['5', 3],
	['6', 4],
	['7', 5],
]);

const FAN_DIRECTION_BY_RAW: ReadonlyMap<string, FanDirection> = new Map<
	string,
	FanDirection
>([
	['0', 'fixed'],
	['1', 'vertical'],
	['2', 'horizontal'],
	['3', 'both'],
]);

/** Raw auto codes 0, 1 and 7 all read as `auto`; writing `auto` uses 1 (assumed). */
export const RAW_CODES = {
	modeByRaw: new Map<string, UnitMode>([
		['0', 'auto'],
		['1', 'auto'],
		['7', 'auto'],
		['2', 'dry'],
		['3', 'cool'],
		['4', 'heat'],
		['6', 'fan'],
	]),
	rawByMode: new Map<UnitMode, string>([
		['auto', '1'],
		['dry', '2'],
		['cool', '3'],
		['heat', '4'],
		['fan', '6'],
	]),
	fanRateByRaw: FAN_RATE_BY_RAW,
	rawByFanRate: invert(FAN_RATE_BY_RAW),
	specialModeByRaw: new Map<string, SpecialMode>([
		['2', 'powerful'],
		['12', 'econo'],
		['13', 'streamer'],
	]),
	kindBySpecialMode: { powerful: '1', econo: '2' } satisfies Record<
		WritableSpecialMode,
		string
	>,
	fanDirectionByRaw: FAN_DIRECTION_BY_RAW,
	rawByFanDirection: invert(FAN_DIRECTION_BY_RAW),
} as const;
