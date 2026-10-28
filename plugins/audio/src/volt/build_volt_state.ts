import type { VoltState } from './volt_state';

/** Test factory: a Volt 1 state with every button off but the given ones. */
export function buildVoltState(
	buttonsOn: Readonly<Partial<VoltState>> = {}
): VoltState {
	return {
		monitor: false,
		vintage: false,
		phantomPower: false,
		...buttonsOn,
	};
}
