import { buildDisplayInfo } from './build_display_info';
import type { DisplayInfo } from './display_info';

/** The three monitors of the PC the plugin is built on, for tests: an Odyssey G95SD in the middle, a PL2530H on top and one on the right. */
export const UserSetup = {
	odyssey: buildDisplayInfo({
		pnpId: 'SAME05C',
		uid: 4353,
		model: 'Odyssey G95SD',
		gdiName: String.raw`\\.\DISPLAY3`,
		bounds: { left: 0, top: 0, width: 5120, height: 1440 },
		hdr: { isSupported: true, isEnabled: false },
	}),
	topIiyama: buildDisplayInfo({
		pnpId: 'IVM6133',
		uid: 4355,
		model: 'PL2530H',
		gdiName: String.raw`\\.\DISPLAY1`,
		bounds: { left: 1580, top: -1080, width: 1920, height: 1080 },
	}),
	rightIiyama: buildDisplayInfo({
		pnpId: 'IVM6133',
		uid: 4357,
		model: 'PL2530H',
		gdiName: String.raw`\\.\DISPLAY2`,
		bounds: { left: 5120, top: -495, width: 1080, height: 1920 },
	}),
} as const satisfies Readonly<Record<string, DisplayInfo>>;
