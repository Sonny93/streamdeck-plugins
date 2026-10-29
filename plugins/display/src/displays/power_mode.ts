/** Values of the MCCS power mode (VCP `0xD6`): on, the standby modes from lightest to deepest, and off. */
export const PowerMode = {
	on: 1,
	standby: 2,
	suspend: 3,
	displayOff: 4,
	powerOff: 5,
} as const;
