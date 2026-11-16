import type { DdcMonitor } from './ddc_monitor';
import type { DisplayInfo } from './display_info';
import type { DisplaySystem } from './display_system';
import type { VcpReply } from './vcp_reply';

type FakeMonitor = {
	display: DisplayInfo;
	capabilities: string | undefined;
	vcp: Map<number, number>;
	systemBrightness: number;
	isListed: boolean;
};

const VCP_MAXIMUM = 100;
const GAMMA_FLOOR = 50;

/** In-memory monitors for tests: DDC/CI answers from a VCP table, system brightness stops at the gamma floor in SDR. */
export class FakeDisplaySystem implements DisplaySystem {
	readonly vcpWrites: Array<
		Readonly<{ monitorId: string; code: number; value: number }>
	> = [];
	private readonly monitors = new Map<string, FakeMonitor>();
	private readonly blackScreens = new Set<string>();

	constructor(readonly options: Readonly<{ canBlackScreen?: boolean }> = {}) {}

	get canBlackScreen(): boolean {
		return this.options.canBlackScreen ?? true;
	}

	plug(
		display: DisplayInfo,
		options: Readonly<{
			capabilities?: string;
			vcp?: ReadonlyMap<number, number>;
		}> = {}
	): void {
		this.monitors.set(display.id, {
			display,
			capabilities: options.capabilities,
			vcp: new Map(options.vcp),
			systemBrightness: 100,
			isListed: true,
		});
	}

	/** Makes the system stop listing a monitor, as some do in standby, while it still answers over DDC/CI. */
	hide(monitorId: string): void {
		const monitor = this.monitors.get(monitorId);
		if (monitor !== undefined) {
			monitor.isListed = false;
		}
	}

	vcpOf(monitorId: string, code: number): number | undefined {
		return this.monitors.get(monitorId)?.vcp.get(code);
	}

	listDisplays(): Promise<readonly DisplayInfo[]> {
		return Promise.resolve(
			[...this.monitors.values()]
				.filter((monitor) => monitor.isListed)
				.map((monitor) => monitor.display)
		);
	}

	readSystemBrightness(display: DisplayInfo): Promise<number | undefined> {
		return Promise.resolve(this.monitors.get(display.id)?.systemBrightness);
	}

	writeSystemBrightness(
		display: DisplayInfo,
		percent: number
	): Promise<number> {
		const applied = display.hdr.isEnabled
			? percent
			: Math.max(GAMMA_FLOOR, percent);
		const monitor = this.monitors.get(display.id);
		if (monitor !== undefined) {
			monitor.systemBrightness = applied;
		}
		return Promise.resolve(applied);
	}

	writeHdr(display: DisplayInfo, isEnabled: boolean): Promise<void> {
		const monitor = this.monitors.get(display.id);
		if (monitor !== undefined) {
			monitor.display = {
				...monitor.display,
				hdr: { ...monitor.display.hdr, isEnabled },
			};
		}
		return Promise.resolve();
	}

	openDdcMonitor(display: DisplayInfo): DdcMonitor | undefined {
		const monitorId = display.id;
		const monitor = this.monitors.get(monitorId);
		if (monitor?.capabilities === undefined) {
			return undefined;
		}
		const { capabilities, vcp } = monitor;
		return {
			readCapabilities: () => Promise.resolve(capabilities),
			readVcp: (code): Promise<VcpReply | undefined> => {
				const current = vcp.get(code);
				return Promise.resolve(
					current === undefined ? undefined : { current, maximum: VCP_MAXIMUM }
				);
			},
			writeVcp: (code, value) => {
				this.vcpWrites.push({ monitorId, code, value });
				vcp.set(code, value);
				return Promise.resolve(true);
			},
			close: () => undefined,
		};
	}

	showBlackScreen(display: DisplayInfo): void {
		this.blackScreens.add(display.id);
	}

	hideBlackScreen(monitorId: string): void {
		this.blackScreens.delete(monitorId);
	}

	hasBlackScreen(monitorId: string): boolean {
		return this.blackScreens.has(monitorId);
	}

	syncBlackScreens(displays: readonly DisplayInfo[]): void {
		for (const monitorId of this.blackScreens) {
			if (!displays.some((display) => display.id === monitorId)) {
				this.blackScreens.delete(monitorId);
			}
		}
	}
}
