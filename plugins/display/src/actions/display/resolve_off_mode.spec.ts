import { describe, expect, it } from 'vitest';

import { buildMonitorSnapshotForTest } from '../../displays/build_monitor_snapshot_for_test';
import { resolveOffMode } from './resolve_off_mode';

const COVERABLE = [buildMonitorSnapshotForTest()];
const UNCOVERABLE = [buildMonitorSnapshotForTest({ canBlackScreen: false })];

describe('resolveOffMode', () => {
	it('should default to a black screen where the system can draw one', () => {
		expect(resolveOffMode(undefined, COVERABLE)).toBe('blackScreen');
	});

	it('should default to standby where the system cannot draw a black screen', () => {
		expect(resolveOffMode(undefined, UNCOVERABLE)).toBe('standby');
	});

	it('should keep a saved black screen even where it is unavailable', () => {
		expect(resolveOffMode('blackScreen', UNCOVERABLE)).toBe('blackScreen');
	});

	it('should keep a saved standby', () => {
		expect(resolveOffMode('standby', COVERABLE)).toBe('standby');
	});
});
