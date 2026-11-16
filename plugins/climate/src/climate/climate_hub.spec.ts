import { createFakeScheduler } from 'deck-kit/async/create_fake_scheduler';
import { describe, expect, it, vi } from 'vitest';

import { UnitUnreachableError } from '../daikin/errors/unit_unreachable_error';
import { UnitWriteUnconfirmedError } from '../daikin/errors/unit_write_unconfirmed_error';
import { buildUnitSnapshotForTest } from './build_unit_snapshot_for_test';
import { buildUnitStateForTest } from './build_unit_state_for_test';
import { ClimateHub } from './climate_hub';
import { ClimateUnitUnavailableError } from './climate_unit_unavailable_error';
import { createFakeUnitDriver } from './create_fake_unit_driver';

const TEST_HOST = '127.0.0.1';
const POLL_INTERVAL = 15_000;
const MAXIMUM_POLL_INTERVAL = 60_000;
const QUIET = 400;

const ENERGY_INTERVAL = 600_000;
const ENERGY_RETRY = 60_000;
const ENERGY = {
	heat: { todayKilowattHours: 0.1, lastSevenDaysKilowattHours: 3.1 },
	cool: { todayKilowattHours: 0.3, lastSevenDaysKilowattHours: 0.6 },
};

function createHub(
	timings: Readonly<{
		energyIntervalMilliseconds?: number;
		energyRetryMilliseconds?: number;
		minimumPollIntervalMs?: number;
	}> = {}
) {
	const { minimumPollIntervalMs, ...hubTimings } = timings;
	const scheduler = createFakeScheduler();
	const unit = createFakeUnitDriver(minimumPollIntervalMs);
	const onError = vi.fn();
	const hub = new ClimateHub({
		createDriver: () => unit.driver,
		schedule: scheduler.schedule,
		pollIntervalMilliseconds: POLL_INTERVAL,
		maximumPollIntervalMilliseconds: MAXIMUM_POLL_INTERVAL,
		energyIntervalMilliseconds: ENERGY_INTERVAL,
		energyRetryMilliseconds: ENERGY_RETRY,
		now: scheduler.now,
		...hubTimings,
		onError,
	});
	hub.setHost(TEST_HOST);
	return { hub, scheduler, unit, onError };
}

async function createReadyHub(timings: Parameters<typeof createHub>[0] = {}) {
	const context = createHub(timings);
	context.hub.subscribe(() => undefined);
	context.unit.answerRead(buildUnitSnapshotForTest());
	await context.scheduler.settle();
	context.unit.answerEnergy(ENERGY);
	await context.scheduler.settle();
	return context;
}

describe('ClimateHub polling', () => {
	it('should not read the unit when nobody is subscribed', async () => {
		const { scheduler, unit } = createHub();

		await scheduler.advance(MAXIMUM_POLL_INTERVAL * 2);

		expect(unit.readCount()).toBe(0);
	});

	it('should read at once when the first listener subscribes', () => {
		const { hub, unit } = createHub();

		hub.subscribe(() => undefined);

		expect(unit.readCount()).toBe(1);
	});

	it('should read again every interval while a listener is subscribed', async () => {
		const { scheduler, unit } = await createReadyHub();

		await scheduler.advance(POLL_INTERVAL);

		expect(unit.readCount()).toBe(2);
	});

	it('should stop reading when the last listener leaves', async () => {
		const { hub, scheduler, unit } = createHub();
		const unsubscribeFirst = hub.subscribe(() => undefined);
		const unsubscribeSecond = hub.subscribe(() => undefined);
		unit.answerRead(buildUnitSnapshotForTest());
		await scheduler.settle();

		unsubscribeFirst();
		unsubscribeSecond();
		await scheduler.advance(MAXIMUM_POLL_INTERVAL * 2);

		expect(unit.readCount()).toBe(1);
	});

	it('should report unconfigured when the hub has no address', () => {
		const hub = new ClimateHub({
			createDriver: () => createFakeUnitDriver().driver,
			schedule: createFakeScheduler().schedule,
			pollIntervalMilliseconds: POLL_INTERVAL,
			maximumPollIntervalMilliseconds: MAXIMUM_POLL_INTERVAL,
			energyIntervalMilliseconds: ENERGY_INTERVAL,
			energyRetryMilliseconds: ENERGY_RETRY,
			now: () => 0,
			onError: vi.fn(),
		});

		expect(hub.view.status).toBe('unconfigured');
	});

	it('should report loading until the first read and ready after it', async () => {
		const { hub, unit, scheduler } = createHub();
		hub.subscribe(() => undefined);
		const statusBeforeRead = hub.view.status;

		unit.answerRead(buildUnitSnapshotForTest());
		await scheduler.settle();

		expect([statusBeforeRead, hub.view.status]).toEqual(['loading', 'ready']);
	});
});

describe('ClimateHub polling after listeners come and go', () => {
	const MINIMUM_POLL_INTERVAL = 10_000;

	it('should not read again when listeners leave and return within the minimum interval', async () => {
		const { hub, scheduler, unit } = createHub({
			minimumPollIntervalMs: MINIMUM_POLL_INTERVAL,
		});
		const unsubscribeFirst = hub.subscribe(() => undefined);
		unit.answerRead(buildUnitSnapshotForTest());
		await scheduler.settle();
		unsubscribeFirst();

		for (let flip = 0; flip < 3; flip += 1) {
			await scheduler.advance(1_000);
			hub.subscribe(() => undefined)();
		}

		expect(unit.readCount()).toBe(1);
	});

	it('should read once the minimum interval has passed after a listener returns', async () => {
		const { hub, scheduler, unit } = createHub({
			minimumPollIntervalMs: MINIMUM_POLL_INTERVAL,
		});
		hub.subscribe(() => undefined)();
		unit.answerRead(buildUnitSnapshotForTest());
		await scheduler.settle();
		await scheduler.advance(3_000);

		hub.subscribe(() => undefined);
		await scheduler.advance(MINIMUM_POLL_INTERVAL - 3_000);

		expect(unit.readCount()).toBe(2);
	});

	it('should not read the energy when the poll stopped before its read resolved', async () => {
		const { hub, scheduler, unit } = createHub();
		const unsubscribe = hub.subscribe(() => undefined);

		unsubscribe();
		unit.answerRead(buildUnitSnapshotForTest());
		await scheduler.settle();

		expect(unit.energyReadCount()).toBe(0);
	});
});

describe('ClimateHub when the unit does not answer', () => {
	it('should keep the last snapshot and report unreachable when a read fails', async () => {
		const { hub, scheduler, unit, onError } = await createReadyHub();
		const failure = new UnitUnreachableError(TEST_HOST);

		await scheduler.advance(POLL_INTERVAL);
		unit.failRead(failure);
		await scheduler.settle();

		expect(hub.view).toMatchObject({
			status: 'unreachable',
			state: { targetTemperature: 21 },
			sensors: { indoorTemperature: 23 },
		});
		expect(onError).toHaveBeenCalledWith(failure);
	});

	it('should double the interval up to the maximum while reads keep failing, then reset it on success', async () => {
		const { hub, scheduler, unit } = createHub();
		const failure = new UnitUnreachableError(TEST_HOST);
		const readCounts: number[] = [];
		async function waitAndCount(milliseconds: number): Promise<void> {
			await scheduler.advance(milliseconds);
			readCounts.push(unit.readCount());
		}
		hub.subscribe(() => undefined);

		unit.failRead(failure);
		await scheduler.settle();
		await waitAndCount(POLL_INTERVAL * 2 - 1);
		await waitAndCount(1);
		unit.failRead(failure);
		await scheduler.settle();
		await waitAndCount(MAXIMUM_POLL_INTERVAL - 1);
		await waitAndCount(1);
		unit.failRead(failure);
		await scheduler.settle();
		await waitAndCount(MAXIMUM_POLL_INTERVAL - 1);
		await waitAndCount(1);
		unit.answerRead(buildUnitSnapshotForTest());
		await scheduler.settle();
		unit.answerEnergy(ENERGY);
		await scheduler.settle();
		await waitAndCount(POLL_INTERVAL);

		expect(readCounts).toEqual([1, 2, 2, 3, 3, 4, 5]);
	});
});

describe('ClimateHub writes', () => {
	it('should send one write with the latest value of each field when requests come in a burst', async () => {
		const { hub, scheduler, unit } = await createReadyHub();

		const first = hub.requestChange({ targetTemperature: 22 }, QUIET);
		const second = hub.requestChange(
			{ targetTemperature: 23, fanRate: 3 },
			QUIET
		);
		const third = hub.requestChange({ isPowered: true }, QUIET);
		await scheduler.advance(QUIET);
		unit.answerWrite(
			buildUnitStateForTest({
				isPowered: true,
				targetTemperature: 23,
				fanRate: 3,
			})
		);
		await Promise.all([first, second, third]);

		expect(unit.writtenPatches()).toEqual([
			{ targetTemperature: 23, fanRate: 3, isPowered: true },
		]);
	});

	it('should show the pending values at once when a change is requested', async () => {
		const { hub } = await createReadyHub();

		void hub.requestChange({ targetTemperature: 25 }, QUIET);

		expect(hub.view.state?.targetTemperature).toBe(25);
	});

	it('should wait for the quiet period after the last request before writing', async () => {
		const { hub, scheduler, unit } = await createReadyHub();

		void hub.requestChange({ targetTemperature: 22 }, QUIET);
		await scheduler.advance(QUIET - 1);
		void hub.requestChange({ targetTemperature: 23 }, QUIET);
		await scheduler.advance(QUIET - 1);
		const writesBeforeQuiet = unit.writtenPatches().length;
		await scheduler.advance(1);

		expect([writesBeforeQuiet, unit.writtenPatches().length]).toEqual([0, 1]);
	});

	it('should use the state returned by the write without reading again', async () => {
		const { hub, scheduler, unit } = await createReadyHub();
		const readsBeforeWrite = unit.readCount();

		const change = hub.requestChange({ isPowered: true }, 0);
		await scheduler.advance(0);
		unit.answerWrite(
			buildUnitStateForTest({ isPowered: true, targetTemperature: 22 })
		);
		await change;

		expect(hub.view.state).toMatchObject({
			isPowered: true,
			targetTemperature: 22,
		});
		expect(unit.readCount()).toBe(readsBeforeWrite);
	});

	it('should send a request made during a write in a second write after its own quiet period', async () => {
		const { hub, scheduler, unit } = await createReadyHub();
		const firstChange = hub.requestChange({ targetTemperature: 22 }, 0);
		await scheduler.advance(0);

		const secondChange = hub.requestChange({ fanRate: 2 }, QUIET);
		await scheduler.advance(QUIET * 2);
		const patchesDuringFlight = unit.writtenPatches().length;
		unit.answerWrite(buildUnitStateForTest({ targetTemperature: 22 }));
		await firstChange;
		await scheduler.settle();
		unit.answerWrite(
			buildUnitStateForTest({ targetTemperature: 22, fanRate: 2 })
		);
		await secondChange;

		expect(patchesDuringFlight).toBe(1);
		expect(unit.writtenPatches()).toEqual([
			{ targetTemperature: 22 },
			{ fanRate: 2 },
		]);
	});

	it('should wait for the quiet period of a request made during a write before sending it', async () => {
		const { hub, scheduler, unit } = await createReadyHub();
		const firstChange = hub.requestChange({ targetTemperature: 22 }, 0);
		await scheduler.advance(0);
		const secondChange = hub.requestChange({ fanRate: 2 }, QUIET);

		unit.answerWrite(buildUnitStateForTest({ targetTemperature: 22 }));
		await firstChange;
		await scheduler.settle();
		const patchesBeforeQuiet = unit.writtenPatches().length;
		await scheduler.advance(QUIET);
		unit.answerWrite(buildUnitStateForTest({ fanRate: 2 }));
		await secondChange;

		expect([patchesBeforeQuiet, unit.writtenPatches().length]).toEqual([1, 2]);
	});

	it('should revert the display and reject every request of the patch when the write fails', async () => {
		const { hub, scheduler, unit } = await createReadyHub();
		const failure = new UnitUnreachableError(TEST_HOST);
		const firstOutcome = expect(
			hub.requestChange({ targetTemperature: 25 }, QUIET)
		).rejects.toBe(failure);
		const secondOutcome = expect(
			hub.requestChange({ fanRate: 4 }, QUIET)
		).rejects.toBe(failure);

		await scheduler.advance(QUIET);
		unit.failWrite(failure);
		await Promise.all([firstOutcome, secondOutcome]);

		expect(hub.view.state).toMatchObject({
			targetTemperature: 21,
			fanRate: 'auto',
		});
	});

	it('should drop the patch requested during a write that fails', async () => {
		const { hub, scheduler, unit } = await createReadyHub();
		const failure = new UnitUnreachableError(TEST_HOST);
		const firstOutcome = expect(
			hub.requestChange({ targetTemperature: 25 }, 0)
		).rejects.toBe(failure);
		await scheduler.advance(0);
		const secondOutcome = expect(
			hub.requestChange({ targetTemperature: 26 }, QUIET)
		).rejects.toBe(failure);

		unit.failWrite(failure);
		await Promise.all([firstOutcome, secondOutcome]);
		await scheduler.advance(QUIET);

		expect(unit.writtenPatches()).toHaveLength(1);
		expect(hub.view.state?.targetTemperature).toBe(21);
	});

	it('should read the unit and never resend when a write is unconfirmed', async () => {
		const { hub, scheduler, unit } = await createReadyHub();
		const readsBeforeWrite = unit.readCount();
		const outcome = expect(
			hub.requestChange({ isPowered: true }, 0)
		).rejects.toBeInstanceOf(UnitWriteUnconfirmedError);
		await scheduler.advance(0);

		unit.failWrite(new UnitWriteUnconfirmedError(TEST_HOST, {}));
		await outcome;
		await scheduler.advance(QUIET);

		expect(unit.readCount()).toBe(readsBeforeWrite + 1);
		expect(unit.writtenPatches()).toHaveLength(1);
	});

	it('should show an unknown target temperature when the mode changes without a temperature', async () => {
		const { hub } = await createReadyHub();

		void hub.requestChange({ mode: 'heat' }, QUIET);

		expect(hub.view.state).toMatchObject({
			mode: 'heat',
			targetTemperature: null,
		});
	});

	it('should keep the target temperature of the request when the mode changes with a temperature', async () => {
		const { hub } = await createReadyHub();

		void hub.requestChange({ mode: 'heat', targetTemperature: 20 }, QUIET);

		expect(hub.view.state).toMatchObject({
			mode: 'heat',
			targetTemperature: 20,
		});
	});

	it('should reject a request when the hub has no address', async () => {
		const hub = new ClimateHub({
			createDriver: () => createFakeUnitDriver().driver,
			schedule: createFakeScheduler().schedule,
			pollIntervalMilliseconds: POLL_INTERVAL,
			maximumPollIntervalMilliseconds: MAXIMUM_POLL_INTERVAL,
			energyIntervalMilliseconds: ENERGY_INTERVAL,
			energyRetryMilliseconds: ENERGY_RETRY,
			now: () => 0,
			onError: vi.fn(),
		});

		await expect(
			hub.requestChange({ isPowered: true }, 0)
		).rejects.toBeInstanceOf(ClimateUnitUnavailableError);
	});
});

describe('ClimateHub polls and writes together', () => {
	it('should not poll while a change is pending or being written', async () => {
		const { hub, scheduler, unit } = await createReadyHub();
		const readsBefore = unit.readCount();

		const change = hub.requestChange({ isPowered: true }, QUIET);
		await scheduler.advance(POLL_INTERVAL);
		const readsDuringWrite = unit.readCount();
		unit.answerWrite(buildUnitStateForTest({ isPowered: true }));
		await change;
		await scheduler.advance(POLL_INTERVAL);

		expect(readsDuringWrite).toBe(readsBefore);
		expect(unit.readCount()).toBe(readsBefore + 1);
	});

	it('should discard the result of a read that started before the last write finished', async () => {
		const { hub, scheduler, unit } = createHub();
		hub.subscribe(() => undefined);
		const change = hub.requestChange({ isPowered: true }, 0);
		await scheduler.advance(0);
		unit.answerWrite(buildUnitStateForTest({ isPowered: true }));
		await change;

		unit.answerRead(buildUnitSnapshotForTest({ state: { isPowered: false } }));
		await scheduler.settle();

		expect(hub.view.state?.isPowered).toBe(true);
	});
});

describe('ClimateHub setHost', () => {
	it('should forget the state and reject the pending changes when the address changes', async () => {
		const { hub } = await createReadyHub();
		const outcome = expect(
			hub.requestChange({ isPowered: true }, QUIET)
		).rejects.toBeInstanceOf(ClimateUnitUnavailableError);

		hub.setHost('127.0.0.2');
		await outcome;

		expect(hub.view).toEqual({
			status: 'loading',
			sensors: undefined,
			state: undefined,
		});
	});

	it('should report unconfigured when the address is removed', async () => {
		const { hub } = await createReadyHub();

		hub.setHost(undefined);

		expect(hub.view.status).toBe('unconfigured');
	});
});

describe('ClimateHub energy', () => {
	it('should read the energy right after the first snapshot and show it in the view', async () => {
		const { hub, unit } = await createReadyHub();

		expect(unit.energyReadCount()).toBe(1);
		expect(hub.view.energy).toEqual(ENERGY);
	});

	it('should read the energy again only once its interval has passed', async () => {
		const { scheduler, unit } = await createReadyHub({
			energyIntervalMilliseconds: 20_000,
		});

		await scheduler.advance(POLL_INTERVAL);
		unit.answerRead(buildUnitSnapshotForTest());
		await scheduler.settle();
		const readsBeforeInterval = unit.energyReadCount();
		await scheduler.advance(POLL_INTERVAL);
		unit.answerRead(buildUnitSnapshotForTest());
		await scheduler.settle();

		expect([readsBeforeInterval, unit.energyReadCount()]).toEqual([1, 2]);
	});

	it('should keep the previous energy and the ready status when an energy read fails', async () => {
		const { hub, scheduler, unit, onError } = await createReadyHub({
			energyIntervalMilliseconds: POLL_INTERVAL,
		});
		const failure = new UnitUnreachableError(TEST_HOST);

		await scheduler.advance(POLL_INTERVAL);
		unit.answerRead(buildUnitSnapshotForTest());
		await scheduler.settle();
		unit.failEnergy(failure);
		await scheduler.settle();

		expect(hub.view.energy).toEqual(ENERGY);
		expect(hub.view.status).toBe('ready');
		expect(onError).toHaveBeenCalledWith(failure);
	});

	it('should wait for the retry delay before reading the energy again after a failure', async () => {
		const { hub, scheduler, unit } = createHub({
			energyRetryMilliseconds: 40_000,
		});
		hub.subscribe(() => undefined);
		unit.answerRead(buildUnitSnapshotForTest());
		await scheduler.settle();
		unit.failEnergy(new UnitUnreachableError(TEST_HOST));
		await scheduler.settle();

		await scheduler.advance(POLL_INTERVAL);
		unit.answerRead(buildUnitSnapshotForTest());
		await scheduler.settle();
		const readsBeforeRetry = unit.energyReadCount();
		await scheduler.advance(POLL_INTERVAL * 2);
		unit.answerRead(buildUnitSnapshotForTest());
		await scheduler.settle();

		expect([readsBeforeRetry, unit.energyReadCount()]).toEqual([1, 2]);
	});

	it('should not read the energy while a change is pending', async () => {
		const { hub, scheduler, unit } = await createReadyHub({
			energyIntervalMilliseconds: POLL_INTERVAL,
		});

		void hub.requestChange({ isPowered: true }, ENERGY_INTERVAL);
		await scheduler.advance(POLL_INTERVAL * 2);

		expect(unit.energyReadCount()).toBe(1);
	});
});

describe('ClimateHub requestSpecialMode', () => {
	it('should write the special mode and use the state it returns', async () => {
		const { hub, scheduler, unit } = await createReadyHub();

		const change = hub.requestSpecialMode('powerful', true);
		await scheduler.settle();
		unit.answerSpecialWrite(
			buildUnitStateForTest({ isPowered: true, specialModes: ['powerful'] })
		);
		await change;

		expect(unit.specialWrites()).toEqual([
			{ mode: 'powerful', isActive: true },
		]);
		expect(hub.view.state?.specialModes).toEqual(['powerful']);
	});

	it('should wait for a pending patch to be written before writing the special mode', async () => {
		const { hub, scheduler, unit } = await createReadyHub();
		const patch = hub.requestChange({ isPowered: true }, QUIET);
		const special = hub.requestSpecialMode('econo', true);

		await scheduler.advance(QUIET);
		const specialWritesDuringPatch = unit.specialWrites().length;
		unit.answerWrite(buildUnitStateForTest({ isPowered: true }));
		await patch;
		await scheduler.settle();
		unit.answerSpecialWrite(
			buildUnitStateForTest({ isPowered: true, specialModes: ['econo'] })
		);
		await special;

		expect(specialWritesDuringPatch).toBe(0);
		expect(unit.specialWrites()).toHaveLength(1);
	});

	it('should hold a patch requested during the special mode write until it ends', async () => {
		const { hub, scheduler, unit } = await createReadyHub();
		const special = hub.requestSpecialMode('powerful', true);
		await scheduler.settle();

		const patch = hub.requestChange({ targetTemperature: 24 }, 0);
		await scheduler.advance(0);
		const patchesDuringSpecial = unit.writtenPatches().length;
		unit.answerSpecialWrite(
			buildUnitStateForTest({ specialModes: ['powerful'] })
		);
		await special;
		await scheduler.settle();
		unit.answerWrite(buildUnitStateForTest({ targetTemperature: 24 }));
		await patch;

		expect(patchesDuringSpecial).toBe(0);
		expect(unit.writtenPatches()).toEqual([{ targetTemperature: 24 }]);
	});

	it('should discard the result of a read that started before the special mode write ended', async () => {
		const { hub, scheduler, unit } = createHub();
		hub.subscribe(() => undefined);
		const change = hub.requestSpecialMode('powerful', true);
		await scheduler.settle();
		unit.answerSpecialWrite(
			buildUnitStateForTest({ isPowered: true, specialModes: ['powerful'] })
		);
		await change;

		unit.answerRead(buildUnitSnapshotForTest());
		await scheduler.settle();

		expect(hub.view.state?.specialModes).toEqual(['powerful']);
	});

	it('should notify the listeners and reject with the error when the write fails', async () => {
		const { hub, scheduler, unit } = await createReadyHub();
		const listener = vi.fn();
		hub.subscribe(listener);
		const failure = new UnitUnreachableError(TEST_HOST);
		const outcome = expect(hub.requestSpecialMode('econo', true)).rejects.toBe(
			failure
		);
		await scheduler.settle();

		unit.failSpecialWrite(failure);
		await outcome;

		expect(listener).toHaveBeenCalled();
	});

	it('should read the unit and never resend when the special mode write is unconfirmed', async () => {
		const { hub, scheduler, unit } = await createReadyHub();
		const readsBefore = unit.readCount();
		const outcome = expect(
			hub.requestSpecialMode('econo', true)
		).rejects.toBeInstanceOf(UnitWriteUnconfirmedError);
		await scheduler.settle();

		unit.failSpecialWrite(new UnitWriteUnconfirmedError(TEST_HOST, {}));
		await outcome;

		expect(unit.readCount()).toBe(readsBefore + 1);
		expect(unit.specialWrites()).toHaveLength(1);
	});

	it('should reject when the hub has no address', async () => {
		const hub = new ClimateHub({
			createDriver: () => createFakeUnitDriver().driver,
			schedule: createFakeScheduler().schedule,
			pollIntervalMilliseconds: POLL_INTERVAL,
			maximumPollIntervalMilliseconds: MAXIMUM_POLL_INTERVAL,
			energyIntervalMilliseconds: ENERGY_INTERVAL,
			energyRetryMilliseconds: ENERGY_RETRY,
			now: () => 0,
			onError: vi.fn(),
		});

		await expect(
			hub.requestSpecialMode('powerful', true)
		).rejects.toBeInstanceOf(ClimateUnitUnavailableError);
	});
});
