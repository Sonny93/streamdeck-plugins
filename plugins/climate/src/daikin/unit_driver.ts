import type {
	DesiredUnitState,
	UnitCapabilities,
	UnitEnergy,
	UnitIdentity,
	UnitSnapshot,
	UnitState,
	WritableSpecialMode,
} from './unit_types';

export type UnitDriver = {
	readonly hints: { readonly minimumPollIntervalMs: number };
	readonly readSnapshot: () => Promise<UnitSnapshot>;
	/** Resolves with the state re-read after the write. */
	readonly writeState: (desired: DesiredUnitState) => Promise<UnitState>;
	/** Switches one special mode on or off; turning one on replaces the other. Resolves with the state re-read after the write. */
	readonly writeSpecialMode: (
		mode: WritableSpecialMode,
		isActive: boolean
	) => Promise<UnitState>;
	readonly readCapabilities: () => Promise<UnitCapabilities>;
	/** Reads the energy used in heating and cooling, from `get_week_power_ex`. */
	readonly readEnergy: () => Promise<UnitEnergy>;
	readonly readIdentity: () => Promise<UnitIdentity>;
};
