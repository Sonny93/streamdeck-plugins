/**
 * Range of the white level of SDR content while HDR is on, in thousandths of 80 nits:
 * the "SDR content brightness" slider of Windows goes from 80 nits at 0 to 480 nits at 100.
 */
export const SdrWhiteLevel = {
	minimum: 1000,
	maximum: 6000,
} as const;
