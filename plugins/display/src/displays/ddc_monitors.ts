import { SerialQueue } from '../shared/serial_queue';
import type { DdcMonitor } from './ddc_monitor';
import type { DdcReading } from './ddc_reading';
import { DdcWriteError } from './ddc_write_error';
import type { DisplayInfo } from './display_info';
import type { DisplaySystem } from './display_system';
import { parseVcpCapabilities } from './parse_vcp_capabilities';
import { pickStandbyMode } from './pick_standby_mode';
import type { VcpCapabilities } from './vcp_capabilities';
import { VcpCode } from './vcp_code';

const PERCENT = 100;
const DEFAULT_BRIGHTNESS_MAXIMUM = 100;
/** The capabilities string takes about a second to read; a monitor that never answers is not asked again and again. */
const MAX_CAPABILITY_ATTEMPTS = 3;
const NO_READING: DdcReading = {
	brightness: undefined,
	powerMode: undefined,
	standbyMode: undefined,
};

type OpenMonitor = {
	/** Where the monitor was when opened; a moved monitor is opened again, as Windows may give it another handle. */
	placement: string;
	monitor: DdcMonitor;
	queue: SerialQueue;
	capabilities: VcpCapabilities | undefined;
	capabilityAttempts: number;
	brightnessMaximum: number;
	reading: DdcReading;
};

function placementOf(display: DisplayInfo): string {
	const { left, top, width, height } = display.bounds;
	return `${display.gdiName}@${String(left)},${String(top)},${String(width)}x${String(height)}`;
}

/**
 * Keeps the monitors opened for DDC/CI and what was last read from them.
 * The exchanges with one monitor run one after the other; different monitors talk in parallel, each on its own cable.
 */
export class DdcMonitors {
	private readonly monitors = new Map<string, OpenMonitor>();

	/** Opens the new monitors and closes those gone, except the ones in `keptIds` (turned off by the plugin, to turn them on again). */
	sync(
		system: DisplaySystem,
		displays: readonly DisplayInfo[],
		keptIds: ReadonlySet<string>
	): void {
		for (const [monitorId, open] of this.monitors) {
			const display = displays.find((candidate) => candidate.id === monitorId);
			const isGone =
				display === undefined
					? !keptIds.has(monitorId)
					: placementOf(display) !== open.placement;
			if (isGone) {
				open.monitor.close();
				this.monitors.delete(monitorId);
			}
		}
		for (const display of displays) {
			if (this.monitors.has(display.id)) {
				continue;
			}
			const monitor = system.openDdcMonitor(display);
			if (monitor !== undefined) {
				this.monitors.set(display.id, {
					placement: placementOf(display),
					monitor,
					queue: new SerialQueue(),
					capabilities: undefined,
					capabilityAttempts: 0,
					brightnessMaximum: DEFAULT_BRIGHTNESS_MAXIMUM,
					reading: NO_READING,
				});
			}
		}
	}

	reading(monitorId: string): DdcReading {
		return this.monitors.get(monitorId)?.reading ?? NO_READING;
	}

	/** Reads the brightness and power mode of a monitor, and its capabilities the first time. */
	async read(monitorId: string): Promise<void> {
		const open = this.monitors.get(monitorId);
		if (open === undefined) {
			return;
		}
		await open.queue.run(async () => {
			if (
				open.capabilities === undefined &&
				open.capabilityAttempts < MAX_CAPABILITY_ATTEMPTS
			) {
				open.capabilityAttempts += 1;
				const capabilities = await open.monitor.readCapabilities();
				open.capabilities =
					capabilities === undefined
						? undefined
						: parseVcpCapabilities(capabilities);
			}
			const brightness = await open.monitor.readVcp(VcpCode.brightness);
			const powerMode = await open.monitor.readVcp(VcpCode.powerMode);
			if (brightness !== undefined && brightness.maximum > 0) {
				open.brightnessMaximum = brightness.maximum;
			}
			// A monitor turned off may stop answering: what it said last stays true until it answers again.
			open.reading = {
				brightness:
					brightness === undefined || brightness.maximum === 0
						? open.reading.brightness
						: Math.round((brightness.current * PERCENT) / brightness.maximum),
				powerMode: powerMode?.current ?? open.reading.powerMode,
				standbyMode:
					open.capabilities === undefined
						? undefined
						: pickStandbyMode(open.capabilities),
			};
		});
	}

	/** Sets the brightness of a monitor, in percent. */
	async writeBrightness(monitorId: string, percent: number): Promise<void> {
		await this.write(monitorId, VcpCode.brightness, (open) =>
			Math.round((percent * open.brightnessMaximum) / PERCENT)
		);
		const open = this.monitors.get(monitorId);
		if (open !== undefined) {
			open.reading = { ...open.reading, brightness: percent };
		}
	}

	async writePowerMode(monitorId: string, mode: number): Promise<void> {
		await this.write(monitorId, VcpCode.powerMode, () => mode);
		const open = this.monitors.get(monitorId);
		if (open !== undefined) {
			open.reading = { ...open.reading, powerMode: mode };
		}
	}

	private async write(
		monitorId: string,
		vcpCode: number,
		valueOf: (open: OpenMonitor) => number
	): Promise<void> {
		const open = this.monitors.get(monitorId);
		const isWritten =
			open !== undefined &&
			(await open.queue.run(() =>
				open.monitor.writeVcp(vcpCode, valueOf(open))
			));
		if (!isWritten) {
			throw new DdcWriteError({ vcpCode });
		}
	}
}
