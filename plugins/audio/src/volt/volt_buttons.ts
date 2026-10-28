/** Bit of each front panel button in the state report (0x02) and in the settings report (0x10); the two layouts differ. */
export const VoltButtons = {
	monitor: { stateBit: 0x10, settingBit: 0x04 },
	vintage: { stateBit: 0x40, settingBit: 0x40 },
	phantomPower: { stateBit: 0x08, settingBit: 0x02 },
} as const;
