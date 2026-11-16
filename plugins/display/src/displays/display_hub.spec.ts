import { describe, expect, it, vi } from 'vitest';

import { DisplayHub } from './display_hub';
import type { DisplayInfo } from './display_info';
import { FakeDisplaySystem } from './fake_display_system';
import { UserSetup } from './user_setup';

const IIYAMA_CAPABILITIES = '(prot(monitor)vcp(10 12 60(01 0F 11) D6(01 05)))';
const ODYSSEY_CAPABILITIES = '(prot(monitor)vcp(10 12 D6(01 04) 60(01 03)))';

function createSystem(): FakeDisplaySystem {
	const system = new FakeDisplaySystem();
	system.plug(UserSetup.topIiyama, {
		capabilities: IIYAMA_CAPABILITIES,
		vcp: new Map([
			[0x10, 60],
			[0xd6, 1],
		]),
	});
	system.plug(UserSetup.odyssey, {
		capabilities: ODYSSEY_CAPABILITIES,
		vcp: new Map([
			[0x10, 50],
			[0xd6, 1],
		]),
	});
	system.plug(UserSetup.rightIiyama, {
		capabilities: IIYAMA_CAPABILITIES,
		vcp: new Map([
			[0x10, 100],
			[0xd6, 1],
		]),
	});
	return system;
}

function createHub(system: FakeDisplaySystem) {
	const onError = vi.fn();
	const hub = new DisplayHub({
		loadDisplaySystem: () => Promise.resolve(system),
		schedule: () => () => undefined,
		pollIntervalMilliseconds: 2000,
		onError,
	});
	return { hub, onError };
}

/** A system whose listing waits until `release` is called, to hold a read in flight. */
class GatedDisplaySystem extends FakeDisplaySystem {
	listCalls = 0;
	private release: () => void = () => undefined;
	private gate = Promise.resolve();

	hold(): void {
		this.gate = new Promise((resolve) => {
			this.release = resolve;
		});
	}

	open(): void {
		this.release();
	}

	override async listDisplays(): Promise<readonly DisplayInfo[]> {
		this.listCalls += 1;
		await this.gate;
		return super.listDisplays();
	}
}

function createScheduledHub(system: FakeDisplaySystem) {
	const scheduled: Array<() => void> = [];
	const hub = new DisplayHub({
		loadDisplaySystem: () => Promise.resolve(system),
		schedule: (callback) => {
			scheduled.push(callback);
			return () => undefined;
		},
		pollIntervalMilliseconds: 2000,
		onError: vi.fn(),
	});
	return { hub, scheduled };
}

function monitorOf(hub: DisplayHub, monitorId: string) {
	return hub.current?.monitors.find((monitor) => monitor.id === monitorId);
}

describe('DisplayHub', () => {
	it('reads every monitor, the main one first, with its DDC/CI and system brightness', async () => {
		const { hub } = createHub(createSystem());

		const snapshot = await hub.refresh();

		expect(snapshot?.monitors.map((monitor) => monitor.name)).toEqual([
			'Odyssey G95SD (main)',
			'PL2530H (top)',
			'PL2530H (right)',
		]);
		expect(monitorOf(hub, UserSetup.topIiyama.id)).toMatchObject({
			monitorBrightness: 60,
			systemBrightness: 100,
			power: 'on',
			canStandby: true,
		});
		expect(monitorOf(hub, UserSetup.odyssey.id)?.ignoresMonitorBrightness).toBe(
			true
		);
	});

	it('changes the brightness of a monitor over DDC/CI and shows it', async () => {
		const system = createSystem();
		const { hub } = createHub(system);
		await hub.refresh();

		await hub.changeBrightness(UserSetup.topIiyama.id, 'monitor', -15);

		expect(system.vcpOf(UserSetup.topIiyama.id, 0x10)).toBe(45);
		expect(monitorOf(hub, UserSetup.topIiyama.id)?.monitorBrightness).toBe(45);
	});

	it('should report through onError when the display system cannot be loaded to show a change', async () => {
		const system = createSystem();
		const loadFailure = new Error('System unavailable');
		let isLoadFailing = false;
		const onError = vi.fn();
		const hub = new DisplayHub({
			loadDisplaySystem: () =>
				isLoadFailing ? Promise.reject(loadFailure) : Promise.resolve(system),
			schedule: () => () => undefined,
			pollIntervalMilliseconds: 2000,
			onError,
		});
		await hub.refresh();
		isLoadFailing = true;

		await hub
			.setBrightness(UserSetup.topIiyama.id, 'monitor', 30)
			.catch(() => undefined);
		await new Promise((resolve) => {
			setImmediate(resolve);
		});

		expect(onError).toHaveBeenCalledWith(loadFailure);
	});

	it('merges the brightness changes asked while one is written', async () => {
		const system = createSystem();
		const { hub } = createHub(system);
		await hub.refresh();

		await Promise.all([
			hub.changeBrightness(UserSetup.topIiyama.id, 'monitor', 5),
			hub.changeBrightness(UserSetup.topIiyama.id, 'monitor', 5),
			hub.changeBrightness(UserSetup.topIiyama.id, 'monitor', 5),
		]);

		expect(system.vcpOf(UserSetup.topIiyama.id, 0x10)).toBe(75);
		expect(system.vcpWrites.map((write) => write.value)).toEqual([65, 75]);
	});

	it('stops the system brightness at the gamma floor in SDR', async () => {
		const { hub } = createHub(createSystem());
		await hub.refresh();

		await hub.setBrightness(UserSetup.odyssey.id, 'system', 30);

		expect(monitorOf(hub, UserSetup.odyssey.id)?.systemBrightness).toBe(50);
	});

	it('covers a monitor with a black screen, lowering its backlight until it wakes', async () => {
		const system = createSystem();
		const { hub } = createHub(system);
		await hub.refresh();

		await hub.toggleScreens([UserSetup.topIiyama.id], 'blackScreen');
		expect(monitorOf(hub, UserSetup.topIiyama.id)?.power).toBe('blackScreen');
		expect(system.vcpOf(UserSetup.topIiyama.id, 0x10)).toBe(0);

		await hub.toggleScreens([UserSetup.topIiyama.id], 'blackScreen');
		expect(monitorOf(hub, UserSetup.topIiyama.id)?.power).toBe('on');
		expect(system.vcpOf(UserSetup.topIiyama.id, 0x10)).toBe(60);
	});

	it('keeps a brightness asked under a black screen for when the monitor wakes', async () => {
		const system = createSystem();
		const { hub } = createHub(system);
		await hub.refresh();
		await hub.toggleScreens([UserSetup.topIiyama.id], 'blackScreen');

		await hub.setBrightness(UserSetup.topIiyama.id, 'monitor', 100);
		await hub.changeBrightness(UserSetup.topIiyama.id, 'monitor', -20);
		expect(system.vcpOf(UserSetup.topIiyama.id, 0x10)).toBe(0);
		expect(monitorOf(hub, UserSetup.topIiyama.id)?.monitorBrightness).toBe(80);

		await hub.toggleScreens([UserSetup.topIiyama.id], 'blackScreen');
		expect(system.vcpOf(UserSetup.topIiyama.id, 0x10)).toBe(80);
	});

	it('keeps the backlight of a monitor that ignores DDC/CI brightness', async () => {
		const system = createSystem();
		const { hub } = createHub(system);
		await hub.refresh();

		await hub.toggleScreens([UserSetup.odyssey.id], 'blackScreen');

		expect(system.vcpOf(UserSetup.odyssey.id, 0x10)).toBe(50);
	});

	it('wakes a monitor put in standby even once the system stops listing it', async () => {
		const system = createSystem();
		const { hub } = createHub(system);
		await hub.refresh();

		await hub.toggleScreens([UserSetup.rightIiyama.id], 'standby');
		expect(system.vcpOf(UserSetup.rightIiyama.id, 0xd6)).toBe(5);
		system.hide(UserSetup.rightIiyama.id);
		await hub.refresh();
		expect(monitorOf(hub, UserSetup.rightIiyama.id)?.power).toBe('standby');

		await hub.toggleScreens([UserSetup.rightIiyama.id], 'standby');
		expect(system.vcpOf(UserSetup.rightIiyama.id, 0xd6)).toBe(1);
	});

	it('turns every monitor off while one is on, then all of them on', async () => {
		const system = createSystem();
		const { hub } = createHub(system);
		await hub.refresh();
		const ids = [UserSetup.odyssey.id, UserSetup.topIiyama.id];
		await hub.toggleScreens([UserSetup.topIiyama.id], 'blackScreen');

		await hub.toggleScreens(ids, 'blackScreen');
		expect(ids.map((monitorId) => monitorOf(hub, monitorId)?.power)).toEqual([
			'blackScreen',
			'blackScreen',
		]);

		await hub.toggleScreens(ids, 'blackScreen');
		expect(ids.map((monitorId) => monitorOf(hub, monitorId)?.power)).toEqual([
			'on',
			'on',
		]);
	});

	it('switches the HDR of a monitor', async () => {
		const { hub } = createHub(createSystem());
		await hub.refresh();

		await hub.toggleHdr(UserSetup.odyssey.id);

		expect(monitorOf(hub, UserSetup.odyssey.id)?.hdr).toEqual({
			isSupported: true,
			isEnabled: true,
		});
	});

	it('refuses a black screen when the system cannot draw one, and still turns the monitor on', async () => {
		const system = new FakeDisplaySystem({ canBlackScreen: false });
		system.plug(UserSetup.topIiyama, {
			capabilities: IIYAMA_CAPABILITIES,
			vcp: new Map([[0xd6, 1]]),
		});
		const { hub } = createHub(system);
		await hub.refresh();

		await expect(
			hub.toggleScreens([UserSetup.topIiyama.id], 'blackScreen')
		).rejects.toMatchObject({ code: 'E_MONITOR_UNAVAILABLE' });
		await hub.toggleScreens([UserSetup.topIiyama.id], 'standby');
		expect(monitorOf(hub, UserSetup.topIiyama.id)?.canBlackScreen).toBe(false);
		expect(system.vcpOf(UserSetup.topIiyama.id, 0xd6)).toBe(5);
	});
});

describe('DisplayHub refresh', () => {
	it('should share one queued read between the refreshes asked while another read runs', async () => {
		const system = new GatedDisplaySystem();
		system.plug(UserSetup.topIiyama);
		const { hub } = createHub(system);
		system.hold();
		const running = hub.refresh();
		await vi.waitFor(() => {
			expect(system.listCalls).toBe(1);
		});

		const first = hub.refresh();
		const second = hub.refresh();
		const third = hub.refresh();
		system.open();
		await Promise.all([running, first, second, third]);

		expect(first).toBe(second);
		expect(second).toBe(third);
		expect(system.listCalls).toBe(2);
	});

	it('should read again for a refresh asked after the queued read started', async () => {
		const system = new GatedDisplaySystem();
		system.plug(UserSetup.topIiyama);
		const { hub } = createHub(system);

		await hub.refresh();
		await hub.refresh();

		expect(system.listCalls).toBe(2);
	});
});

describe('DisplayHub polling', () => {
	it('schedules the next poll only once the current read is done', async () => {
		const system = new GatedDisplaySystem();
		system.plug(UserSetup.topIiyama);
		system.hold();
		const { hub, scheduled } = createScheduledHub(system);

		hub.subscribe(() => undefined);
		await Promise.resolve();
		expect(scheduled).toHaveLength(0);

		system.open();
		await vi.waitFor(() => {
			expect(scheduled).toHaveLength(1);
		});
		expect(system.listCalls).toBe(1);
	});

	it('keeps a single read in flight however many polls come due', async () => {
		const system = new GatedDisplaySystem();
		system.plug(UserSetup.topIiyama);
		const { hub, scheduled } = createScheduledHub(system);
		hub.subscribe(() => undefined);
		await vi.waitFor(() => {
			expect(scheduled).toHaveLength(1);
		});
		system.hold();

		scheduled[0]?.();
		scheduled[0]?.();
		await vi.waitFor(() => {
			expect(system.listCalls).toBe(2);
		});
		await new Promise((resolve) => setTimeout(resolve, 0));

		expect(system.listCalls).toBe(2);
		system.open();
		await vi.waitFor(() => {
			expect(scheduled.length).toBeGreaterThan(1);
		});
	});

	it('stops polling once the last listener leaves, even with a read in flight', async () => {
		const system = new GatedDisplaySystem();
		system.plug(UserSetup.topIiyama);
		system.hold();
		const { hub, scheduled } = createScheduledHub(system);
		const unsubscribe = hub.subscribe(() => undefined);

		unsubscribe();
		system.open();
		await vi.waitFor(() => {
			expect(system.listCalls).toBe(1);
		});
		await new Promise((resolve) => setTimeout(resolve, 0));

		expect(scheduled).toHaveLength(0);
	});
});
