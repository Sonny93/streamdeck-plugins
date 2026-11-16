import { onceAsync } from 'deck-kit/async/once_async';
import type { Scheduler } from 'deck-kit/async/scheduler';

import { BlackScreens } from '../displays/black_screens';
import { buildGammaRamp } from '../displays/build_gamma_ramp';
import { DisplaySettingError } from '../displays/display_setting_error';
import type { DisplaySystem } from '../displays/display_system';
import { percentToSdrWhiteLevel } from '../displays/percent_to_sdr_white_level';
import { readDisplayInfos } from '../displays/read_display_infos';
import { readGammaBrightness } from '../displays/read_gamma_brightness';
import { requireWindowsDisplayData } from '../displays/require_windows_display_data';
import { sdrWhiteLevelToPercent } from '../displays/sdr_white_level_to_percent';
import { writeHdrState } from '../displays/write_hdr_state';
import { writeSdrWhiteLevel } from '../displays/write_sdr_white_level';
import { loadDdcApi } from '../windows/load_ddc_api';
import { loadDisplayConfigApi } from '../windows/load_display_config_api';
import { loadGammaApi } from '../windows/load_gamma_api';
import { loadWindowApi } from '../windows/load_window_api';

/** Lowest brightness Windows lets a gamma ramp give, unless its `GdiICMGammaRange` registry value lifts the limit. */
const GAMMA_FLOOR_PERCENT = 50;
const BLACK_SCREEN_PUMP_INTERVAL_MILLISECONDS = 50;

/** Loads koffi lazily and binds the Windows display, gamma, DDC/CI and window functions, once. */
export function createDisplaySystemLoader(
	schedule: Scheduler
): () => Promise<DisplaySystem> {
	return onceAsync(async (): Promise<DisplaySystem> => {
		const displayConfig = await loadDisplayConfigApi();
		const gamma = await loadGammaApi();
		const ddc = await loadDdcApi();
		const blackScreens = new BlackScreens({
			windowApi: await loadWindowApi(),
			schedule,
			pumpIntervalMilliseconds: BLACK_SCREEN_PUMP_INTERVAL_MILLISECONDS,
		});
		const writeGamma = (gdiName: string, percent: number): boolean =>
			gamma.writeGammaRamp(gdiName, buildGammaRamp(percent));
		return {
			listDisplays: () => Promise.resolve(readDisplayInfos(displayConfig)),
			readSystemBrightness: (display) => {
				const { gdiName, sdrWhiteLevel } = requireWindowsDisplayData(display);
				if (display.hdr.isEnabled) {
					return Promise.resolve(
						sdrWhiteLevel === undefined
							? undefined
							: sdrWhiteLevelToPercent(sdrWhiteLevel)
					);
				}
				const ramp = gamma.readGammaRamp(gdiName);
				return Promise.resolve(
					ramp === undefined ? undefined : readGammaBrightness(ramp)
				);
			},
			writeSystemBrightness: (display, percent) => {
				const { gdiName, target } = requireWindowsDisplayData(display);
				if (display.hdr.isEnabled) {
					writeSdrWhiteLevel(
						displayConfig,
						target,
						percentToSdrWhiteLevel(percent)
					);
					return Promise.resolve(percent);
				}
				if (writeGamma(gdiName, percent)) {
					return Promise.resolve(percent);
				}
				if (writeGamma(gdiName, GAMMA_FLOOR_PERCENT)) {
					return Promise.resolve(GAMMA_FLOOR_PERCENT);
				}
				return Promise.reject(
					new DisplaySettingError({ setting: 'the gamma ramp', result: false })
				);
			},
			writeHdr: (display, isEnabled) => {
				writeHdrState(displayConfig, display, isEnabled);
				return Promise.resolve();
			},
			canBlackScreen: true,
			openDdcMonitor: (display) => {
				const handle = ddc.openPhysicalMonitor({
					left: display.bounds.left,
					top: display.bounds.top,
					right: display.bounds.left + display.bounds.width,
					bottom: display.bounds.top + display.bounds.height,
				});
				if (handle === undefined) {
					return undefined;
				}
				return {
					readCapabilities: () => ddc.readCapabilities(handle),
					readVcp: (code) => ddc.readVcp(handle, code),
					writeVcp: (code, value) => ddc.writeVcp(handle, code, value),
					close: () => {
						ddc.closePhysicalMonitor(handle);
					},
				};
			},
			showBlackScreen: (display) => {
				blackScreens.show(display);
			},
			hideBlackScreen: (monitorId) => {
				blackScreens.hide(monitorId);
			},
			hasBlackScreen: (monitorId) => blackScreens.has(monitorId),
			syncBlackScreens: (displays) => {
				blackScreens.sync(displays);
			},
		};
	});
}
