import { CommandFailedError } from 'deck-kit/process/command_failed_error';

import type { DdcMonitor } from '../displays/ddc_monitor';
import type { LinuxDisplayData } from '../displays/linux_display_data';
import { PowerMode } from '../displays/power_mode';
import { VcpCode } from '../displays/vcp_code';
import type { VcpReply } from '../displays/vcp_reply';
import { CachedVcpReader } from './cached_vcp_reader';
import type { Ddcutil } from './ddcutil';
import { isDrivenByKwin } from './is_driven_by_kwin';
import type { KscreenDoctor } from './kscreen_doctor';
import type { LinuxDisplays } from './linux_displays';

const KWIN_BRIGHTNESS_MAXIMUM = 100;
const DEFAULT_BRIGHTNESS_MAXIMUM = 100;
const NO_MAXIMUM = 0;

async function succeeds(attempt: () => Promise<void>): Promise<boolean> {
	try {
		await attempt();
		return true;
	} catch (error) {
		if (error instanceof CommandFailedError) {
			return false;
		}
		throw error;
	}
}

/**
 * Opens a monitor for DDC/CI the way Linux does it.
 * Where KWin drives the DDC/CI of the output, the backlight goes through KWin (`kscreen-doctor`), which owns that bus traffic;
 * `ddcutil` then only serves the power mode, read once and then only while the monitor is not on (to see it wake) or after a write.
 * Elsewhere `ddcutil` serves both, read through a cache.
 */
export function openLinuxDdcMonitor(
	options: Readonly<{
		data: LinuxDisplayData;
		displays: LinuxDisplays;
		kscreen: KscreenDoctor;
		ddcutil: Ddcutil;
		now: () => number;
		refreshIntervalMilliseconds: number;
		unknownPowerRefreshIntervalMilliseconds: number;
	}>
): DdcMonitor | undefined {
	const { data, displays, kscreen, ddcutil } = options;
	const { busNumber, connector } = data;
	const isKwinBrightness = (): boolean =>
		isDrivenByKwin(displays.outputOf(connector));
	if (busNumber === undefined && !isKwinBrightness()) {
		return undefined;
	}
	const reader = new CachedVcpReader({
		fetch: (codes) =>
			busNumber === undefined
				? Promise.resolve(new Map<number, VcpReply>())
				: ddcutil.getVcp(busNumber, codes),
		now: options.now,
		refreshIntervalMilliseconds: () => refreshIntervalOf(),
	});
	const refreshIntervalOf = (): number => {
		const powerMode = reader.peek(VcpCode.powerMode)?.current;
		if (powerMode === undefined) {
			return options.unknownPowerRefreshIntervalMilliseconds;
		}
		if (powerMode === PowerMode.on && isKwinBrightness()) {
			return Number.POSITIVE_INFINITY;
		}
		return options.refreshIntervalMilliseconds;
	};
	const wantedCodes = (): number[] =>
		isKwinBrightness()
			? [VcpCode.powerMode]
			: [VcpCode.brightness, VcpCode.powerMode];
	const writeOverDdc = async (
		code: number,
		value: number
	): Promise<boolean> => {
		if (busNumber === undefined) {
			return false;
		}
		const isWritten = await succeeds(() =>
			ddcutil.setVcp(busNumber, code, value)
		);
		if (isWritten) {
			reader.remember(code, {
				current: value,
				maximum:
					code === VcpCode.brightness
						? (reader.maximumOf(code) ?? DEFAULT_BRIGHTNESS_MAXIMUM)
						: NO_MAXIMUM,
			});
		}
		return isWritten;
	};
	return {
		readCapabilities: async () => {
			if (busNumber === undefined) {
				return undefined;
			}
			try {
				return await ddcutil.capabilities(busNumber);
			} catch (error) {
				if (error instanceof CommandFailedError) {
					return undefined;
				}
				throw error;
			}
		},
		readVcp: async (code) => {
			if (code === VcpCode.brightness && isKwinBrightness()) {
				const percent = displays.outputOf(connector)?.brightnessPercent;
				return percent === undefined
					? undefined
					: { current: percent, maximum: KWIN_BRIGHTNESS_MAXIMUM };
			}
			return reader.read(code, wantedCodes());
		},
		writeVcp: (code, value) => {
			if (code === VcpCode.brightness && isKwinBrightness()) {
				return succeeds(() => kscreen.setBrightness(connector, value));
			}
			return writeOverDdc(code, value);
		},
		close: () => undefined,
	};
}
