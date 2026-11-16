import { describe, expect, it } from 'vitest';

import { buildMonitorSnapshotForTest } from '../../displays/build_monitor_snapshot_for_test';
import { KeyState } from '../keys/key_state';
import type { DisplayActionConfig } from './display_action_config';
import { readDisplayActionConfig } from './read_display_action_config';
import { resolveScreenPowerKeyState } from './resolve_screen_power_key_state';

function configOf(
	offMode?: DisplayActionConfig['offMode']
): DisplayActionConfig {
	return readDisplayActionConfig({ offMode }, { offersAll: true });
}

describe('resolveScreenPowerKeyState', () => {
	it('should be on while every monitor is on', () => {
		expect(
			resolveScreenPowerKeyState(
				[buildMonitorSnapshotForTest()],
				configOf('blackScreen')
			)
		).toBe(KeyState.on);
	});

	it('should be unavailable without monitor', () => {
		expect(resolveScreenPowerKeyState([], configOf('standby'))).toBe(
			KeyState.unavailable
		);
	});

	it('should be unavailable in black screen mode when the system cannot draw one', () => {
		const monitors = [buildMonitorSnapshotForTest({ canBlackScreen: false })];

		expect(resolveScreenPowerKeyState(monitors, configOf('blackScreen'))).toBe(
			KeyState.unavailable
		);
	});

	it('should be on in standby mode by default where the system cannot draw a black screen', () => {
		const monitors = [buildMonitorSnapshotForTest({ canBlackScreen: false })];

		expect(resolveScreenPowerKeyState(monitors, configOf())).toBe(KeyState.on);
	});

	it('should still work in standby mode when the system cannot draw a black screen', () => {
		const monitors = [buildMonitorSnapshotForTest({ canBlackScreen: false })];

		expect(resolveScreenPowerKeyState(monitors, configOf('standby'))).toBe(
			KeyState.on
		);
	});
});
