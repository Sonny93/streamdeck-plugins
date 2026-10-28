import { describe, expect, it } from 'vitest';

import { buildFakeUser32 } from './fake_user32';
import { isForegroundWindowOwnedBy } from './is_foreground_window_owned_by';

const TARGET_PROCESS_ID = 4242;
const OTHER_PROCESS_ID = 7;
const FOREGROUND_HANDLE = 99n;

function buildUser32(
	foregroundWindow: bigint | undefined,
	foregroundProcessId: number
) {
	return buildFakeUser32({
		readProcessId: (window) =>
			window === FOREGROUND_HANDLE ? foregroundProcessId : 0,
		getForegroundWindow: () => foregroundWindow,
	});
}

describe('isForegroundWindowOwnedBy', () => {
	it('should return true when the foreground window belongs to the process', () => {
		expect(
			isForegroundWindowOwnedBy(
				buildUser32(FOREGROUND_HANDLE, TARGET_PROCESS_ID),
				TARGET_PROCESS_ID
			)
		).toBe(true);
	});

	it('should return false when the foreground window belongs to another process', () => {
		expect(
			isForegroundWindowOwnedBy(
				buildUser32(FOREGROUND_HANDLE, OTHER_PROCESS_ID),
				TARGET_PROCESS_ID
			)
		).toBe(false);
	});

	it('should return false when there is no foreground window', () => {
		expect(
			isForegroundWindowOwnedBy(
				buildUser32(undefined, TARGET_PROCESS_ID),
				TARGET_PROCESS_ID
			)
		).toBe(false);
	});
});
