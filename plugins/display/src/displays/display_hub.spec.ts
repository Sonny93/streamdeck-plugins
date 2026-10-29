import { describe, expect, it, vi } from 'vitest';

import { DisplayHub } from './display_hub';
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

function monitorOf(hub: DisplayHub, monitorId: string) {
	return hub.current?.monitors.find((monitor) => monitor.id === monitorId);
}

describe('DisplayHub', () => {
	it('reads every monitor, the main one first, with its DDC/CI and Windows brightness', async () => {
		const { hub } = createHub(createSystem());

		const snapshot = await hub.refresh();

		expect(snapshot?.monitors.map((monitor) => monitor.name)).toEqual([
			'Odyssey G95SD (main)',
			'PL2530H (top)',
			'PL2530H (right)',
		]);
		expect(monitorOf(hub, UserSetup.topIiyama.id)).toMatchObject({
			monitorBrightness: 60,
			windowsBrightness: 100,
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

	it('stops the Windows brightness at the gamma floor in SDR', async () => {
		const { hub } = createHub(createSystem());
		await hub.refresh();

		await hub.setBrightness(UserSetup.odyssey.id, 'windows', 30);

		expect(monitorOf(hub, UserSetup.odyssey.id)?.windowsBrightness).toBe(50);
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

	it('keeps the backlight of a monitor that ignores DDC/CI brightness', async () => {
		const system = createSystem();
		const { hub } = createHub(system);
		await hub.refresh();

		await hub.toggleScreens([UserSetup.odyssey.id], 'blackScreen');

		expect(system.vcpOf(UserSetup.odyssey.id, 0x10)).toBe(50);
	});

	it('wakes a monitor put in standby even once Windows stops listing it', async () => {
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
});
