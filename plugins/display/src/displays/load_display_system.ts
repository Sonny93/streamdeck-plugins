import { onceAsync } from '../shared/once_async';
import type { Scheduler } from '../shared/scheduler';
import { loadDdcApi } from '../windows/load_ddc_api';
import { loadDisplayConfigApi } from '../windows/load_display_config_api';
import { loadGammaApi } from '../windows/load_gamma_api';
import { loadWindowApi } from '../windows/load_window_api';
import { BlackScreens } from './black_screens';
import { buildGammaRamp } from './build_gamma_ramp';
import { DisplaySettingError } from './display_setting_error';
import type { DisplaySystem } from './display_system';
import { percentToSdrWhiteLevel } from './percent_to_sdr_white_level';
import { readDisplayInfos } from './read_display_infos';
import { readGammaBrightness } from './read_gamma_brightness';
import { sdrWhiteLevelToPercent } from './sdr_white_level_to_percent';
import { writeHdrState } from './write_hdr_state';
import { writeSdrWhiteLevel } from './write_sdr_white_level';

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
			listDisplays: () => readDisplayInfos(displayConfig),
			readWindowsBrightness: (display) => {
				if (display.hdr.isEnabled) {
					return display.sdrWhiteLevel === undefined
						? undefined
						: sdrWhiteLevelToPercent(display.sdrWhiteLevel);
				}
				const ramp = gamma.readGammaRamp(display.gdiName);
				return ramp === undefined ? undefined : readGammaBrightness(ramp);
			},
			writeWindowsBrightness: (display, percent) => {
				if (display.hdr.isEnabled) {
					writeSdrWhiteLevel(
						displayConfig,
						display.target,
						percentToSdrWhiteLevel(percent)
					);
					return percent;
				}
				if (writeGamma(display.gdiName, percent)) {
					return percent;
				}
				if (writeGamma(display.gdiName, GAMMA_FLOOR_PERCENT)) {
					return GAMMA_FLOOR_PERCENT;
				}
				throw new DisplaySettingError({
					setting: 'the gamma ramp',
					result: false,
				});
			},
			writeHdr: (display, isEnabled) => {
				writeHdrState(displayConfig, display, isEnabled);
			},
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
