import type { Scheduler } from 'deck-kit/async/scheduler';
import type { NativePointer } from 'deck-kit/windows/native_pointer';

import type { WindowApi } from '../windows/window_api';
import type { DisplayInfo } from './display_info';

/**
 * Black, topmost windows that cover monitors without turning them off, so Windows keeps its layout.
 * While one is shown, the messages of the plugin thread are handled at a short interval, so Windows never sees the windows hang.
 */
export class BlackScreens {
	private readonly windows = new Map<string, NativePointer>();
	private cancelPump: (() => void) | undefined;

	constructor(
		private readonly options: Readonly<{
			windowApi: WindowApi;
			schedule: Scheduler;
			pumpIntervalMilliseconds: number;
		}>
	) {}

	show(display: DisplayInfo): void {
		const window = this.windows.get(display.id);
		if (window !== undefined && this.options.windowApi.isWindow(window)) {
			this.options.windowApi.raiseWindow(window, display.bounds);
			return;
		}
		const created = this.options.windowApi.createBlackWindow(display.bounds);
		if (created === undefined) {
			return;
		}
		this.windows.set(display.id, created);
		this.options.windowApi.raiseWindow(created, display.bounds);
		this.cancelPump ??= this.options.schedule(() => {
			this.pump();
		}, this.options.pumpIntervalMilliseconds);
	}

	hide(monitorId: string): void {
		const window = this.windows.get(monitorId);
		if (window === undefined) {
			return;
		}
		this.windows.delete(monitorId);
		this.options.windowApi.destroyWindow(window);
		this.options.windowApi.pumpMessages();
	}

	has(monitorId: string): boolean {
		const window = this.windows.get(monitorId);
		return window !== undefined && this.options.windowApi.isWindow(window);
	}

	sync(displays: readonly DisplayInfo[]): void {
		for (const monitorId of this.windows.keys()) {
			const display = displays.find((candidate) => candidate.id === monitorId);
			if (display === undefined || !this.has(monitorId)) {
				this.hide(monitorId);
			} else {
				this.show(display);
			}
		}
	}

	private pump(): void {
		this.options.windowApi.pumpMessages();
		if (this.windows.size === 0) {
			this.cancelPump = undefined;
			return;
		}
		this.cancelPump = this.options.schedule(() => {
			this.pump();
		}, this.options.pumpIntervalMilliseconds);
	}
}
