import type { DdcMonitors } from './ddc_monitors';
import type { DisplayInfo } from './display_info';
import type { DisplaySystem } from './display_system';
import type { MonitorSnapshot } from './monitor_snapshot';
import { MonitorUnavailableError } from './monitor_unavailable_error';
import { PowerMode } from './power_mode';
import type { ScreenOffMode } from './screen_off_mode';

/**
 * Turns monitors off and on again.
 * A black screen also lowers the backlight of a monitor that takes a DDC/CI brightness, and gives it back on waking;
 * a monitor put in standby is remembered, so it can be woken even if Windows stops listing it.
 */
export class ScreenPowerSwitch {
	private readonly savedBacklights = new Map<string, number>();
	private readonly sleeping = new Map<string, DisplayInfo>();

	constructor(private readonly ddc: DdcMonitors) {}

	/** Whether a monitor is under a black screen with its backlight lowered, to give back when it wakes. */
	keepsBacklight(monitorId: string): boolean {
		return this.savedBacklights.has(monitorId);
	}

	/** Backlight a monitor under a black screen gets back when it wakes, if it has one to give back. */
	keptBacklight(monitorId: string): number | undefined {
		return this.savedBacklights.get(monitorId);
	}

	/** Changes the backlight a monitor under a black screen gets back when it wakes. */
	keepBacklight(monitorId: string, percent: number): void {
		this.savedBacklights.set(monitorId, percent);
	}

	/** Monitors the plugin put in standby, as Windows last described them. */
	get sleepingDisplays(): readonly DisplayInfo[] {
		return [...this.sleeping.values()];
	}

	async turnOff(
		system: DisplaySystem,
		display: DisplayInfo,
		monitor: MonitorSnapshot,
		mode: ScreenOffMode
	): Promise<void> {
		if (mode === 'standby') {
			const standbyMode = this.ddc.reading(display.id).standbyMode;
			if (standbyMode === undefined) {
				throw new MonitorUnavailableError({
					monitorId: display.id,
					reason: 'The monitor cannot be turned off over DDC/CI',
				});
			}
			this.sleeping.set(display.id, display);
			try {
				await this.ddc.writePowerMode(display.id, standbyMode);
			} catch (error) {
				this.sleeping.delete(display.id);
				throw error;
			}
			return;
		}
		system.showBlackScreen(display);
		const backlight = monitor.monitorBrightness;
		if (backlight !== undefined && !monitor.ignoresMonitorBrightness) {
			this.savedBacklights.set(display.id, backlight);
			await this.ddc.writeBrightness(display.id, 0);
		}
	}

	async wake(system: DisplaySystem, monitor: MonitorSnapshot): Promise<void> {
		system.hideBlackScreen(monitor.id);
		if (monitor.power === 'standby') {
			await this.ddc.writePowerMode(monitor.id, PowerMode.on);
		}
		this.sleeping.delete(monitor.id);
		const backlight = this.savedBacklights.get(monitor.id);
		if (backlight !== undefined) {
			this.savedBacklights.delete(monitor.id);
			await this.ddc.writeBrightness(monitor.id, backlight);
		}
	}
}
