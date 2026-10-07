import { describe, expect, it } from 'vitest';

import type { User32 } from './user32';
import { buildFakeUser32 } from './fake_user32';
import type { WindowHandle } from './window_handle';
import { selectTaskbarWindows } from './select_taskbar_windows';

const TARGET_PROCESS_ID = 4242;
const OTHER_PROCESS_ID = 7;

let nextHandle = 1;

type FakeWindow = Readonly<{
	handle: WindowHandle;
	processId: number;
	isVisible: boolean;
	hasOwner: boolean;
}>;

function buildWindow(overrides: Partial<FakeWindow> = {}): FakeWindow {
	return {
		handle: BigInt(nextHandle++),
		processId: TARGET_PROCESS_ID,
		isVisible: true,
		hasOwner: false,
		...overrides,
	};
}

function buildUser32(windows: ReadonlyArray<FakeWindow>): User32 {
	const find = (handle: WindowHandle): FakeWindow | undefined =>
		windows.find((window) => window.handle === handle);
	return buildFakeUser32({
		listTopLevelWindows: () => windows.map((window) => window.handle),
		readProcessId: (handle) => find(handle)?.processId ?? 0,
		isVisible: (handle) => find(handle)?.isVisible ?? false,
		hasOwner: (handle) => find(handle)?.hasOwner ?? false,
	});
}

describe('selectTaskbarWindows', () => {
	it('should select a visible unowned window of the process', () => {
		const window = buildWindow();

		expect(
			selectTaskbarWindows(buildUser32([window]), TARGET_PROCESS_ID)
		).toEqual([window.handle]);
	});

	it('should skip windows of other processes', () => {
		const window = buildWindow({ processId: OTHER_PROCESS_ID });

		expect(
			selectTaskbarWindows(buildUser32([window]), TARGET_PROCESS_ID)
		).toEqual([]);
	});

	it('should skip invisible windows', () => {
		const window = buildWindow({ isVisible: false });

		expect(
			selectTaskbarWindows(buildUser32([window]), TARGET_PROCESS_ID)
		).toEqual([]);
	});

	it('should skip owned windows', () => {
		const window = buildWindow({ hasOwner: true });

		expect(
			selectTaskbarWindows(buildUser32([window]), TARGET_PROCESS_ID)
		).toEqual([]);
	});
});
