import { runCommand, type CommandRunner } from 'deck-kit/process/run_command';

import type { DisplayInfo } from '../displays/display_info';
import type { DisplaySystem } from '../displays/display_system';
import { MonitorUnavailableError } from '../displays/monitor_unavailable_error';
import { Ddcutil } from './ddcutil';
import { isDrivenByKwin } from './is_driven_by_kwin';
import { KscreenDoctor } from './kscreen_doctor';
import { LinuxDisplays } from './linux_displays';
import { openLinuxDdcMonitor } from './open_linux_ddc_monitor';
import { percentToSdrNits } from './percent_to_sdr_nits';
import { readConnectorEdid } from './read_connector_edid';
import { requireLinuxDisplayData } from './require_linux_display_data';
import { sdrNitsToPercent } from './sdr_nits_to_percent';

/** A `ddcutil` read costs a process and a bus exchange: the values it gives are kept this long. */
const DDC_REFRESH_INTERVAL_MILLISECONDS = 15_000;
/** A monitor whose power mode is unknown (it did not answer) is asked again this often. */
const UNKNOWN_POWER_REFRESH_INTERVAL_MILLISECONDS = 60_000;

export type LinuxDisplaySystemOptions = Readonly<{
	runCommand?: CommandRunner;
	readEdid?: (connector: string) => Promise<Uint8Array | undefined>;
	now?: () => number;
}>;

/**
 * The monitors of a KDE Plasma session: outputs, HDR and brightness through `kscreen-doctor`, DDC/CI through `ddcutil`.
 * System brightness is the dimming of KWin on outputs whose backlight it does not drive, and the SDR brightness
 * (100 to 1000 nits, shown as 0 to 100 %) while HDR is on. Wayland lets no program draw over a monitor, so there is no black screen.
 */
export function createLinuxDisplaySystem(
	options: LinuxDisplaySystemOptions = {}
): DisplaySystem {
	const run = options.runCommand ?? runCommand;
	const now = options.now ?? Date.now;
	const kscreen = new KscreenDoctor(run);
	const ddcutil = new Ddcutil(run);
	const displays = new LinuxDisplays({
		kscreen,
		ddcutil,
		readEdid: options.readEdid ?? readConnectorEdid,
		now,
	});
	const outputOf = (display: DisplayInfo) =>
		displays.outputOf(requireLinuxDisplayData(display).connector);
	return {
		listDisplays: () => displays.list(),
		readSystemBrightness: (display) => {
			const output = outputOf(display);
			if (output?.hdr.isEnabled === true) {
				return Promise.resolve(
					output.sdrBrightnessNits === undefined
						? undefined
						: sdrNitsToPercent(output.sdrBrightnessNits)
				);
			}
			return Promise.resolve(
				isDrivenByKwin(output) ? undefined : output?.brightnessPercent
			);
		},
		writeSystemBrightness: async (display, percent) => {
			const output = outputOf(display);
			const { connector } = requireLinuxDisplayData(display);
			if (output?.hdr.isEnabled === true) {
				await kscreen.setSdrBrightness(connector, percentToSdrNits(percent));
				return sdrNitsToPercent(percentToSdrNits(percent));
			}
			if (output === undefined || isDrivenByKwin(output)) {
				throw new MonitorUnavailableError({
					monitorId: display.id,
					reason: 'The system has no brightness to change for the monitor',
				});
			}
			await kscreen.setBrightness(connector, percent);
			return percent;
		},
		writeHdr: async (display, isEnabled) => {
			if (!display.hdr.isSupported) {
				throw new MonitorUnavailableError({
					monitorId: display.id,
					reason: 'The monitor cannot show HDR',
				});
			}
			await kscreen.setHdr(
				requireLinuxDisplayData(display).connector,
				isEnabled
			);
		},
		openDdcMonitor: (display) =>
			openLinuxDdcMonitor({
				data: requireLinuxDisplayData(display),
				displays,
				kscreen,
				ddcutil,
				now,
				refreshIntervalMilliseconds: DDC_REFRESH_INTERVAL_MILLISECONDS,
				unknownPowerRefreshIntervalMilliseconds:
					UNKNOWN_POWER_REFRESH_INTERVAL_MILLISECONDS,
			}),
		canBlackScreen: false,
		showBlackScreen: () => undefined,
		hideBlackScreen: () => undefined,
		hasBlackScreen: () => false,
		syncBlackScreens: () => undefined,
	};
}
