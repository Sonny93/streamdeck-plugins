import type { UnitMode } from '../unit_types';

export type SetpointRange = {
	readonly minimum: number;
	readonly maximum: number;
};

/** Writable setpoint range in degrees per mode. Dry and fan carry no setpoint. */
export const SETPOINT_RANGES: Readonly<
	Partial<Record<UnitMode, SetpointRange>>
> = {
	cool: { minimum: 18, maximum: 32 },
	heat: { minimum: 10, maximum: 30 },
	auto: { minimum: 18, maximum: 30 },
};
