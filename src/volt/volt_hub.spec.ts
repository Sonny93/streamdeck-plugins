import { describe, expect, it, vi } from 'vitest';

import { VoltHub } from './volt_hub';
import type { VoltStatus } from './volt_status';
import { buildVoltState } from './build_volt_state';
import { VoltNotFoundError } from './volt_not_found_error';
import { FakeVoltConnection } from './fake_volt_connection';
import { buildVoltStateReport } from './build_volt_state_report';
import { VoltStateUnknownError } from './volt_state_unknown_error';
import { VoltNotConnectedError } from './volt_not_connected_error';

const RECONNECT_DELAY_MILLISECONDS = 2000;
const MONITOR_AND_PHANTOM_POWER_ON = 0x19;

function flushPromises(): Promise<void> {
	return new Promise((resolve) => {
		setImmediate(resolve);
	});
}

function createHub(openConnection: () => Promise<FakeVoltConnection>) {
	const scheduled: Array<() => void> = [];
	const onError = vi.fn();
	const hub = new VoltHub({
		openConnection,
		schedule: (callback) => {
			scheduled.push(callback);
			return () => undefined;
		},
		reconnectDelayMilliseconds: RECONNECT_DELAY_MILLISECONDS,
		onError,
	});
	const statuses: VoltStatus[] = [];
	hub.subscribe((status) => statuses.push(status));
	return { hub, scheduled, onError, statuses };
}

async function connectHub() {
	const connection = new FakeVoltConnection();
	const created = createHub(() => Promise.resolve(connection));
	created.hub.start();
	await flushPromises();
	return { ...created, connection };
}

describe('VoltHub', () => {
	it('waits for a state report once the Volt 1 is open', async () => {
		const { statuses } = await connectHub();

		expect(statuses).toEqual([
			{ kind: 'disconnected' },
			{ kind: 'waitingForState' },
		]);
	});

	it('follows the button states the Volt 1 reports, once per change', async () => {
		const { hub, connection, statuses } = await connectHub();

		connection.pushReport(buildVoltStateReport(0x11));
		await flushPromises();
		connection.pushReport(buildVoltStateReport(0x11));
		await flushPromises();

		expect(hub.current).toEqual({
			kind: 'ready',
			state: buildVoltState({ monitor: true }),
		});
		expect(statuses).toHaveLength(3);
	});

	it('flips a button and keeps the others, phantom power included', async () => {
		const { hub, connection } = await connectHub();
		connection.pushReport(buildVoltStateReport(MONITOR_AND_PHANTOM_POWER_ON));
		await flushPromises();

		await expect(hub.toggleButton('monitor')).resolves.toBe(false);

		expect(connection.writtenReports.map((report) => report[1])).toEqual([
			0x02,
		]);
		expect(hub.current).toEqual({
			kind: 'ready',
			state: buildVoltState({ phantomPower: true }),
		});
	});

	it('builds each change on the state left by the previous one', async () => {
		const { hub, connection } = await connectHub();
		connection.pushReport(buildVoltStateReport(0x01));
		await flushPromises();

		await Promise.all([
			hub.toggleButton('monitor'),
			hub.toggleButton('vintage'),
		]);

		expect(connection.writtenReports.map((report) => report[1])).toEqual([
			0x04, 0x44,
		]);
	});

	it('refuses to change a button before the Volt 1 reported its state', async () => {
		const { hub, connection } = await connectHub();

		await expect(hub.toggleButton('monitor')).rejects.toBeInstanceOf(
			VoltStateUnknownError
		);
		expect(connection.writtenReports).toEqual([]);
	});

	it('refuses to change a button while the Volt 1 is not connected', async () => {
		const { hub } = createHub(() => Promise.reject(new VoltNotFoundError()));

		await expect(hub.toggleButton('monitor')).rejects.toBeInstanceOf(
			VoltNotConnectedError
		);
	});

	it('closes the link and looks for the Volt 1 again once it is unplugged', async () => {
		const { hub, connection, scheduled, onError } = await connectHub();
		connection.pushReport(buildVoltStateReport(0x11));
		await flushPromises();

		connection.unplug();
		await flushPromises();

		expect(hub.current).toEqual({ kind: 'disconnected' });
		expect(connection.isClosed).toBe(true);
		expect(onError).toHaveBeenCalledOnce();
		expect(scheduled).toHaveLength(1);
	});

	it('tries again later when the Volt 1 cannot be opened', async () => {
		const openConnection = vi
			.fn<() => Promise<FakeVoltConnection>>()
			.mockRejectedValueOnce(new VoltNotFoundError())
			.mockResolvedValueOnce(new FakeVoltConnection());
		const { hub, scheduled } = createHub(openConnection);

		hub.start();
		await flushPromises();
		expect(hub.current).toEqual({ kind: 'disconnected' });

		scheduled[0]?.();
		await flushPromises();
		expect(hub.current).toEqual({ kind: 'waitingForState' });
	});
});
