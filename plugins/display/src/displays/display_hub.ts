import { clampPercent } from '../shared/clamp_percent';
import { LatestValueWriter } from '../shared/latest_value_writer';
import type { BrightnessSource } from './brightness_source';
import { buildMonitorSnapshot } from './build_monitor_snapshot';
import { DdcMonitors } from './ddc_monitors';
import type { DisplayHubOptions } from './display_hub_options';
import type { DisplayInfo } from './display_info';
import type { DisplaySnapshot } from './display_snapshot';
import type { DisplaySystem } from './display_system';
import type { MonitorSnapshot } from './monitor_snapshot';
import { MonitorUnavailableError } from './monitor_unavailable_error';
import type { ScreenOffMode } from './screen_off_mode';
import { ScreenPowerSwitch } from './screen_power_switch';

type DisplaySnapshotListener = (snapshot: DisplaySnapshot | undefined) => void;

function brightnessOf(
	monitor: MonitorSnapshot,
	source: BrightnessSource
): number | undefined {
	return source === 'monitor'
		? monitor.monitorBrightness
		: monitor.windowsBrightness;
}

/**
 * Shares the state of the monitors between every action.
 * It reads them at a fixed interval while someone listens, so changes made outside the plugin show up, and again after each change.
 * Brightness changes asked faster than a monitor takes them are merged, and shown right away.
 */
export class DisplayHub {
	private readonly listeners = new Set<DisplaySnapshotListener>();
	private readonly ddc = new DdcMonitors();
	private readonly power = new ScreenPowerSwitch(this.ddc);
	private readonly writers = new Map<string, LatestValueWriter>();
	private readonly windowsBrightness = new Map<string, number | undefined>();
	private displays: readonly DisplayInfo[] = [];
	private snapshot: DisplaySnapshot | undefined;
	private refreshTail: Promise<unknown> = Promise.resolve();
	private cancelPoll: (() => void) | undefined;

	constructor(private readonly options: DisplayHubOptions) {}

	/** Latest snapshot, `undefined` before the first read or while the monitors cannot be read. */
	get current(): DisplaySnapshot | undefined {
		return this.snapshot;
	}

	/** Registers a listener and calls it right away; the first listener starts the polling and the last one stops it. */
	subscribe(listener: DisplaySnapshotListener): () => void {
		this.listeners.add(listener);
		listener(this.snapshot);
		if (this.cancelPoll === undefined) {
			this.poll();
		}
		return () => {
			this.listeners.delete(listener);
			if (this.listeners.size === 0) {
				this.cancelPoll?.();
				this.cancelPoll = undefined;
			}
		};
	}

	/** Reads the monitors after the reads already asked for, and tells the listeners when something changed. */
	refresh(): Promise<DisplaySnapshot | undefined> {
		const next = this.refreshTail.then(() => this.read());
		this.refreshTail = next;
		return next;
	}

	/** Sets a brightness; a monitor under a black screen keeps it for when it wakes instead of lighting up. */
	async setBrightness(
		monitorId: string,
		source: BrightnessSource,
		percent: number
	): Promise<void> {
		this.requireDisplay(monitorId);
		if (source === 'monitor' && this.power.keepsBacklight(monitorId)) {
			this.power.keepBacklight(monitorId, clampPercent(percent));
			this.publishCurrent();
			return;
		}
		const writing = this.writerOf(monitorId, source).request(
			clampPercent(percent)
		);
		this.publishCurrent();
		try {
			await writing;
		} finally {
			await this.refresh();
		}
	}

	/** Moves the brightness by a number of percent (negative to lower it), from the one being written if any. */
	async changeBrightness(
		monitorId: string,
		source: BrightnessSource,
		deltaPercent: number
	): Promise<void> {
		const monitor = this.requireMonitor(monitorId);
		const base =
			this.writers.get(`${monitorId}:${source}`)?.pendingValue ??
			brightnessOf(monitor, source);
		if (base === undefined) {
			throw new MonitorUnavailableError({
				monitorId,
				reason: 'The monitor has no brightness to change',
			});
		}
		await this.setBrightness(monitorId, source, base + deltaPercent);
	}

	async toggleHdr(monitorId: string): Promise<void> {
		const display = this.requireDisplay(monitorId);
		const system = await this.options.loadDisplaySystem();
		system.writeHdr(display, !display.hdr.isEnabled);
		await this.refresh();
	}

	/** Turns the monitors off when any of them is on, otherwise turns them all on again. */
	async toggleScreens(
		monitorIds: readonly string[],
		mode: ScreenOffMode
	): Promise<void> {
		const system = await this.options.loadDisplaySystem();
		const monitors = monitorIds.map((monitorId) =>
			this.requireMonitor(monitorId)
		);
		const isAnyOn = monitors.some((monitor) => monitor.power === 'on');
		try {
			for (const monitor of monitors) {
				if (!isAnyOn) {
					await this.power.wake(system, monitor);
				} else if (monitor.power === 'on') {
					const display = this.requireDisplay(monitor.id);
					await this.power.turnOff(system, display, monitor, mode);
				}
			}
		} finally {
			await this.refresh();
		}
	}

	private async read(): Promise<DisplaySnapshot | undefined> {
		try {
			const system = await this.options.loadDisplaySystem();
			const displays = system.listDisplays();
			this.displays = displays;
			system.syncBlackScreens(displays);
			const sleepingIds = new Set(
				this.power.sleepingDisplays.map((display) => display.id)
			);
			this.ddc.sync(system, displays, sleepingIds);
			for (const display of displays) {
				this.windowsBrightness.set(
					display.id,
					system.readWindowsBrightness(display)
				);
			}
			await Promise.all(
				[...displays.map((display) => display.id), ...sleepingIds].map(
					(monitorId) => this.ddc.read(monitorId)
				)
			);
			this.publish(this.buildSnapshot(system));
		} catch (error) {
			this.options.onError(error);
			this.publish(undefined);
		}
		return this.snapshot;
	}

	private buildSnapshot(system: DisplaySystem): DisplaySnapshot {
		const sleepingOnly = this.power.sleepingDisplays.filter(
			(display) => !this.displays.some((listed) => listed.id === display.id)
		);
		const monitors = [...this.displays, ...sleepingOnly]
			.toSorted(
				(first, second) =>
					Number(second.isPrimary) - Number(first.isPrimary) ||
					first.bounds.left - second.bounds.left
			)
			.map((display) =>
				buildMonitorSnapshot({
					display,
					listedDisplays: this.displays,
					reading: this.ddc.reading(display.id),
					windowsBrightness: this.windowsBrightness.get(display.id),
					hasBlackScreen: system.hasBlackScreen(display.id),
					keptBacklight: this.power.keptBacklight(display.id),
					pendingMonitorBrightness: this.writers.get(`${display.id}:monitor`)
						?.pendingValue,
					pendingWindowsBrightness: this.writers.get(`${display.id}:windows`)
						?.pendingValue,
				})
			);
		return { monitors };
	}

	private writerOf(
		monitorId: string,
		source: BrightnessSource
	): LatestValueWriter {
		const key = `${monitorId}:${source}`;
		const existing = this.writers.get(key);
		if (existing !== undefined) {
			return existing;
		}
		const writer = new LatestValueWriter(async (percent) => {
			if (source === 'monitor') {
				await this.ddc.writeBrightness(monitorId, percent);
				return;
			}
			const system = await this.options.loadDisplaySystem();
			this.windowsBrightness.set(
				monitorId,
				system.writeWindowsBrightness(this.requireDisplay(monitorId), percent)
			);
		});
		this.writers.set(key, writer);
		return writer;
	}

	private requireDisplay(monitorId: string): DisplayInfo {
		const display =
			this.displays.find((candidate) => candidate.id === monitorId) ??
			this.power.sleepingDisplays.find(
				(candidate) => candidate.id === monitorId
			);
		if (display === undefined) {
			throw new MonitorUnavailableError({
				monitorId,
				reason: 'Windows does not light the monitor',
			});
		}
		return display;
	}

	private requireMonitor(monitorId: string): MonitorSnapshot {
		const monitor = this.snapshot?.monitors.find(
			(candidate) => candidate.id === monitorId
		);
		if (monitor === undefined) {
			throw new MonitorUnavailableError({
				monitorId,
				reason: 'Windows does not light the monitor',
			});
		}
		return monitor;
	}

	private publishCurrent(): void {
		void this.options.loadDisplaySystem().then((system) => {
			this.publish(this.buildSnapshot(system));
		});
	}

	private poll(): void {
		void this.refresh();
		this.cancelPoll = this.options.schedule(() => {
			this.poll();
		}, this.options.pollIntervalMilliseconds);
	}

	private publish(snapshot: DisplaySnapshot | undefined): void {
		if (JSON.stringify(this.snapshot) === JSON.stringify(snapshot)) {
			return;
		}
		this.snapshot = snapshot;
		for (const listener of this.listeners) {
			listener(snapshot);
		}
	}
}
