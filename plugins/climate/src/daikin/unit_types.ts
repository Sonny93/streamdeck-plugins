import type { RawRecord } from './raw_record';

export type UnitMode = 'auto' | 'dry' | 'cool' | 'heat' | 'fan';
export type SpecialMode = 'powerful' | 'econo' | 'streamer';
export type WritableSpecialMode = Exclude<SpecialMode, 'streamer'>;
export type FanRate = 'auto' | 'silent' | 1 | 2 | 3 | 4 | 5;
export type FanDirection = 'fixed' | 'vertical' | 'horizontal' | 'both';
export type SwingSupport = 'none' | 'vertical' | 'horizontal' | 'both';
export type ApiFamily = 'local-http' | 'cloud-only' | 'unknown';

export type UnitState = {
	readonly isPowered: boolean;
	readonly mode: UnitMode;
	readonly targetTemperature: number | null;
	readonly fanRate: FanRate;
	readonly fanDirection: FanDirection;
	/** Active special modes, empty when none. Written through `writeSpecialMode`, never through `writeState`. */
	readonly specialModes: readonly SpecialMode[];
};

export type SensorReading = {
	readonly indoorTemperature: number | null;
	readonly outdoorTemperature: number | null;
	readonly indoorHumidity: number | null;
	readonly compressorFrequency: number | null;
};

export type UnitSnapshot = {
	readonly state: UnitState;
	readonly sensors: SensorReading;
	readonly faultCode: string | null;
	readonly readAt: Date;
	readonly raw: Readonly<Record<string, RawRecord>>;
};

/**
 * Partial patch. Omitted field: keep the current value when the mode is unchanged,
 * use the value memorized by the unit for the target mode when the mode changes.
 */
export type DesiredUnitState = Partial<Omit<UnitState, 'specialModes'>>;

export type UnitCapabilities = {
	readonly isFanRateSettable: boolean;
	readonly swing: SwingSupport;
	readonly hasHumiditySensor: boolean;
};

export type UnitIdentity = {
	readonly name: string;
	readonly mac: string;
	readonly firmwareVersion: string;
	readonly apiFamily: ApiFamily;
};

/** Energy used by the unit in one mode, in kWh: today, and the last seven days counting today. */
export type EnergyConsumption = {
	readonly todayKilowattHours: number;
	readonly lastSevenDaysKilowattHours: number;
};

export type UnitEnergy = {
	readonly heat: EnergyConsumption;
	readonly cool: EnergyConsumption;
};
