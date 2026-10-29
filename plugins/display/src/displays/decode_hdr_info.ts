import type { HdrInfo } from './hdr_info';

const AdvancedColor2Bits = {
	hdrSupported: 1 << 4,
	hdrUserEnabled: 1 << 5,
} as const;
const AdvancedColorBits = { supported: 1 << 0, enabled: 1 << 1 } as const;

/**
 * Decodes the flags Windows reports for the colors of a monitor.
 * `version: 2` reads `DISPLAYCONFIG_GET_ADVANCED_COLOR_INFO_2` (Windows 11 24H2 and later), which tells HDR apart from wide color;
 * `version: 1` reads the older `DISPLAYCONFIG_GET_ADVANCED_COLOR_INFO`, where advanced color is HDR.
 */
export function decodeHdrInfo(flags: number, version: 1 | 2): HdrInfo {
	if (version === 2) {
		return {
			isSupported: (flags & AdvancedColor2Bits.hdrSupported) !== 0,
			isEnabled: (flags & AdvancedColor2Bits.hdrUserEnabled) !== 0,
		};
	}
	return {
		isSupported: (flags & AdvancedColorBits.supported) !== 0,
		isEnabled: (flags & AdvancedColorBits.enabled) !== 0,
	};
}
