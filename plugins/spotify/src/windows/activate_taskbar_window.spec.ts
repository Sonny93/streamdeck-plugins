import { describe, expect, it, vi } from 'vitest';

import { activateTaskbarWindow } from './activate_taskbar_window';
import { buildFakeUser32 } from './fake_user32';
import { WindowActivationError } from './window_activation_error';

const PROCESS_ID = 4242;
const WINDOW_HANDLE = 5n;

function buildUser32Spies(
	overrides: Parameters<typeof buildFakeUser32>[0] = {}
) {
	const calls: string[] = [];
	const user32 = buildFakeUser32({
		listTopLevelWindows: () => [WINDOW_HANDLE],
		readProcessId: () => PROCESS_ID,
		restore: () => calls.push('restore'),
		sendZeroMouseMove: () => calls.push('sendZeroMouseMove'),
		setForeground: () => {
			calls.push('setForeground');
			return true;
		},
		...overrides,
	});
	return { user32, calls };
}

describe('activateTaskbarWindow', () => {
	it('should send a zero mouse move before setting the foreground window', () => {
		const { user32, calls } = buildUser32Spies();

		activateTaskbarWindow(user32, PROCESS_ID);

		expect(calls).toEqual(['sendZeroMouseMove', 'setForeground']);
	});

	it('should restore the window first when it is minimized', () => {
		const { user32, calls } = buildUser32Spies({ isMinimized: () => true });

		activateTaskbarWindow(user32, PROCESS_ID);

		expect(calls).toEqual(['restore', 'sendZeroMouseMove', 'setForeground']);
	});

	it('should set the foreground on the first taskbar window of the process', () => {
		const setForeground = vi.fn(() => true);
		const { user32 } = buildUser32Spies({ setForeground });

		activateTaskbarWindow(user32, PROCESS_ID);

		expect(setForeground).toHaveBeenCalledWith(WINDOW_HANDLE);
	});

	it('should throw an activation error when the process has no taskbar window', () => {
		const { user32 } = buildUser32Spies({ listTopLevelWindows: () => [] });

		expect(() => activateTaskbarWindow(user32, PROCESS_ID)).toThrow(
			WindowActivationError
		);
	});

	it('should throw an activation error when Windows denies the foreground request', () => {
		const { user32 } = buildUser32Spies({ setForeground: () => false });

		expect(() => activateTaskbarWindow(user32, PROCESS_ID)).toThrow('denied');
	});
});
