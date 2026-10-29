import { describe, expect, it } from 'vitest';

import { buildMonitorSnapshotForTest } from '../../displays/build_monitor_snapshot_for_test';
import { resolveBrightnessSource } from './resolve_brightness_source';

describe('resolveBrightnessSource', () => {
	it('changes the monitor itself in auto mode when it takes a DDC/CI brightness', () => {
		expect(resolveBrightnessSource(buildMonitorSnapshotForTest(), 'auto')).toBe(
			'monitor'
		);
	});

	it('falls back to Windows in auto mode for a monitor that ignores DDC/CI brightness', () => {
		const odyssey = buildMonitorSnapshotForTest({
			ignoresMonitorBrightness: true,
		});

		expect(resolveBrightnessSource(odyssey, 'auto')).toBe('windows');
		expect(resolveBrightnessSource(odyssey, 'monitor')).toBe('monitor');
	});

	it('gives nothing when the picked control is missing', () => {
		const withoutDdc = buildMonitorSnapshotForTest({
			monitorBrightness: undefined,
		});

		expect(resolveBrightnessSource(withoutDdc, 'monitor')).toBeUndefined();
		expect(resolveBrightnessSource(withoutDdc, 'auto')).toBe('windows');
	});
});
