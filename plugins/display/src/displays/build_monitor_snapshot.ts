import type { DdcReading } from './ddc_reading';
import { describeMonitorName } from './describe_monitor_name';
import type { DisplayInfo } from './display_info';
import { ignoresDdcBrightness } from './ignores_ddc_brightness';
import type { MonitorSnapshot } from './monitor_snapshot';
import { PowerMode } from './power_mode';
import type { ScreenPower } from './screen_power';

function resolvePower(
	reading: DdcReading,
	options: Readonly<{ hasBlackScreen: boolean; isListed: boolean }>
): ScreenPower {
	if (options.hasBlackScreen) {
		return 'blackScreen';
	}
	const isOff =
		reading.powerMode !== undefined && reading.powerMode !== PowerMode.on;
	return isOff || !options.isListed ? 'standby' : 'on';
}

/**
 * Builds the state of a monitor from what Windows and DDC/CI say, the brightness being written shown in place of the one read.
 * A monitor turned off by the plugin that Windows stopped listing is shown in standby.
 */
export function buildMonitorSnapshot(
	options: Readonly<{
		display: DisplayInfo;
		listedDisplays: readonly DisplayInfo[];
		reading: DdcReading;
		windowsBrightness: number | undefined;
		hasBlackScreen: boolean;
		pendingMonitorBrightness: number | undefined;
		pendingWindowsBrightness: number | undefined;
	}>
): MonitorSnapshot {
	const { display, reading } = options;
	const isListed = options.listedDisplays.some(
		(listed) => listed.id === display.id
	);
	return {
		id: display.id,
		name: describeMonitorName(
			display,
			isListed ? options.listedDisplays : [...options.listedDisplays, display]
		),
		isPrimary: display.isPrimary,
		monitorBrightness: options.pendingMonitorBrightness ?? reading.brightness,
		ignoresMonitorBrightness: ignoresDdcBrightness(display.id),
		windowsBrightness:
			options.pendingWindowsBrightness ?? options.windowsBrightness,
		power: resolvePower(reading, {
			hasBlackScreen: options.hasBlackScreen,
			isListed,
		}),
		canStandby: reading.standbyMode !== undefined,
		hdr: display.hdr,
	};
}
