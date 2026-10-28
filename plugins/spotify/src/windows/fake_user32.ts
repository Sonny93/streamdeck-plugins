import type { User32 } from './user32';

/** Test double for {@link User32}: every call is a no-op unless overridden. */
export function buildFakeUser32(overrides: Partial<User32> = {}): User32 {
	return {
		listTopLevelWindows: () => [],
		readProcessId: () => 0,
		isVisible: () => true,
		hasOwner: () => false,
		stopFlashing: () => undefined,
		getForegroundWindow: () => undefined,
		isMinimized: () => false,
		restore: () => undefined,
		sendZeroMouseMove: () => undefined,
		setForeground: () => true,
		...overrides,
	};
}
