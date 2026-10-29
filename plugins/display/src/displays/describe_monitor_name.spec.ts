import { describe, expect, it } from 'vitest';

import { buildDisplayInfo } from './build_display_info';
import { describeMonitorName } from './describe_monitor_name';
import { UserSetup } from './user_setup';

const DISPLAYS = [
	UserSetup.odyssey,
	UserSetup.topIiyama,
	UserSetup.rightIiyama,
];

describe('describeMonitorName', () => {
	it('names each monitor by its model and its place next to the primary one', () => {
		expect(
			DISPLAYS.map((display) => describeMonitorName(display, DISPLAYS))
		).toEqual(['Odyssey G95SD (main)', 'PL2530H (top)', 'PL2530H (right)']);
	});

	it('adds the GDI name when two monitors of a model share a place', () => {
		const farRight = buildDisplayInfo({
			pnpId: 'IVM6133',
			uid: 4359,
			model: 'PL2530H',
			gdiName: String.raw`\\.\DISPLAY4`,
			bounds: { left: 6200, top: -495, width: 1080, height: 1920 },
		});
		const displays = [...DISPLAYS, farRight];

		expect(describeMonitorName(farRight, displays)).toBe(
			'PL2530H (right, DISPLAY4)'
		);
		expect(describeMonitorName(UserSetup.topIiyama, displays)).toBe(
			'PL2530H (top)'
		);
	});
});
