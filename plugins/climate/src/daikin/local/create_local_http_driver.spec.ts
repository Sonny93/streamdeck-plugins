import { createServer, type Server, type ServerResponse } from 'node:http';
import { afterEach, describe, expect, it } from 'vitest';

import { InvalidCommandError } from '../errors/invalid_command_error';
import { UnitProtocolError } from '../errors/unit_protocol_error';
import { UnitRejectedError } from '../errors/unit_rejected_error';
import { UnitUnreachableError } from '../errors/unit_unreachable_error';
import { UnitWriteUnconfirmedError } from '../errors/unit_write_unconfirmed_error';
import type { FakeUnitOptions } from '../fake/fake_unit_model';
import {
	startFakeDaikinUnit,
	type FakeDaikinUnit,
} from '../fake/start_fake_daikin_unit';
import type { UnitDriver } from '../unit_driver';
import { createLocalHttpDriver } from './create_local_http_driver';
import { UNIT_PATHS } from './unit_paths';

const TIMEOUT_MS = 200;
const UNUSED_HOST = '127.0.0.1:1';
const startedUnits: FakeDaikinUnit[] = [];

async function startUnit(
	options: FakeUnitOptions = {}
): Promise<FakeDaikinUnit> {
	const unit = await startFakeDaikinUnit(options);
	startedUnits.push(unit);
	return unit;
}

afterEach(async () => {
	await Promise.all(startedUnits.splice(0).map((unit) => unit.close()));
});

describe('createLocalHttpDriver reads', () => {
	it('should map the fake unit when reading a snapshot', async () => {
		const unit = await startUnit();
		const driver = createLocalHttpDriver({
			host: unit.host,
			timeoutMs: TIMEOUT_MS,
		});

		const snapshot = await driver.readSnapshot();

		expect(snapshot).toMatchObject({
			state: {
				isPowered: false,
				mode: 'cool',
				targetTemperature: 21,
				fanRate: 'auto',
				fanDirection: 'fixed',
				specialModes: [],
			},
			sensors: {
				indoorTemperature: 23,
				outdoorTemperature: 4,
				indoorHumidity: null,
				compressorFrequency: 0,
			},
			faultCode: null,
		});
		expect(Object.keys(snapshot.raw)).toEqual([
			'get_control_info',
			'get_sensor_info',
		]);
	});

	it('should send minimal headers with connection close when reading', async () => {
		const unit = await startUnit();
		const driver = createLocalHttpDriver({
			host: unit.host,
			timeoutMs: TIMEOUT_MS,
		});

		await driver.readSnapshot();

		const [headers] = unit.receivedRequestHeaders();
		expect(headers).toMatchObject({ connection: 'close', accept: '*/*' });
		expect(headers).not.toHaveProperty('sec-fetch-mode');
	});

	it('should report the fault code when the unit has an error', async () => {
		const unit = await startUnit();
		unit.setSensors({ err: 'A3' });
		const driver = createLocalHttpDriver({
			host: unit.host,
			timeoutMs: TIMEOUT_MS,
		});

		expect((await driver.readSnapshot()).faultCode).toBe('A3');
	});

	it('should reflect a remote change that uses raw auto mode 7 and stemp M', async () => {
		const unit = await startUnit();
		unit.applyRemoteChange({ mode: '7', stemp: 'M' });
		const driver = createLocalHttpDriver({
			host: unit.host,
			timeoutMs: TIMEOUT_MS,
		});

		expect((await driver.readSnapshot()).state).toMatchObject({
			mode: 'auto',
			targetTemperature: null,
		});
	});

	it('should throw a protocol error when the unit reports an unknown mode', async () => {
		const unit = await startUnit();
		unit.applyRemoteChange({ mode: '5' });
		const driver = createLocalHttpDriver({
			host: unit.host,
			timeoutMs: TIMEOUT_MS,
		});

		await expect(driver.readSnapshot()).rejects.toBeInstanceOf(
			UnitProtocolError
		);
	});

	it('should read the capabilities of the fake unit', async () => {
		const unit = await startUnit();
		const driver = createLocalHttpDriver({
			host: unit.host,
			timeoutMs: TIMEOUT_MS,
		});

		expect(await driver.readCapabilities()).toEqual({
			isFanRateSettable: true,
			swing: 'both',
			hasHumiditySensor: false,
		});
	});

	it('should read the decoded identity of the fake unit', async () => {
		const unit = await startUnit();
		const driver = createLocalHttpDriver({
			host: unit.host,
			timeoutMs: TIMEOUT_MS,
		});

		expect(await driver.readIdentity()).toEqual({
			name: 'Test',
			mac: '00005E005301',
			firmwareVersion: '4.2.303',
			apiFamily: 'local-http',
		});
	});

	it('should throw a protocol error when the module is cloud-only', async () => {
		const unit = await startUnit({ kind: 'cloud-only' });
		const driver = createLocalHttpDriver({
			host: unit.host,
			timeoutMs: TIMEOUT_MS,
		});

		await expect(driver.readSnapshot()).rejects.toBeInstanceOf(
			UnitProtocolError
		);
	});

	it('should throw an unreachable error within the timeout when the unit does not answer', async () => {
		const unit = await startUnit();
		unit.setReachable(false);
		const driver = createLocalHttpDriver({
			host: unit.host,
			timeoutMs: TIMEOUT_MS,
		});
		const startedAt = performance.now();

		await expect(driver.readSnapshot()).rejects.toBeInstanceOf(
			UnitUnreachableError
		);
		expect(performance.now() - startedAt).toBeLessThan(TIMEOUT_MS * 5);
	});
});

describe('createLocalHttpDriver writes', () => {
	it('should send the 6 params and return the re-read state when writing', async () => {
		const unit = await startUnit();
		const driver = createLocalHttpDriver({
			host: unit.host,
			timeoutMs: TIMEOUT_MS,
		});

		const state = await driver.writeState({
			isPowered: true,
			mode: 'heat',
			targetTemperature: 20,
		});

		expect(state).toMatchObject({
			isPowered: true,
			mode: 'heat',
			targetTemperature: 20,
		});
		expect(unit.receivedCommands()).toEqual([
			{
				pow: '1',
				mode: '4',
				stemp: '20.0',
				shum: '0',
				f_rate: 'A',
				f_dir: '0',
			},
		]);
	});

	it('should return the normalized fan direction when the unit does not support swing', async () => {
		const unit = await startUnit({ modelInfo: { s_fdir: '0' } });
		const driver = createLocalHttpDriver({
			host: unit.host,
			timeoutMs: TIMEOUT_MS,
		});

		const state = await driver.writeState({ fanDirection: 'both' });

		expect(state.fanDirection).toBe('fixed');
	});

	it('should keep the raw auto code and stemp M untouched when only the power changes', async () => {
		const unit = await startUnit();
		unit.applyRemoteChange({ mode: '7', stemp: 'M', shum: 'AUTO' });
		const driver = createLocalHttpDriver({
			host: unit.host,
			timeoutMs: TIMEOUT_MS,
		});

		await driver.writeState({ isPowered: true });

		expect(unit.readRawControl()).toMatchObject({
			pow: '1',
			mode: '7',
			stemp: 'M',
			shum: 'AUTO',
		});
	});

	it('should write fan mode with absent markers and read it back without a temperature', async () => {
		const unit = await startUnit();
		const driver = createLocalHttpDriver({
			host: unit.host,
			timeoutMs: TIMEOUT_MS,
		});

		const state = await driver.writeState({ isPowered: true, mode: 'fan' });

		expect(unit.receivedCommands()).toEqual([
			{
				pow: '1',
				mode: '6',
				stemp: '--',
				shum: '--',
				f_rate: 'A',
				f_dir: '0',
			},
		]);
		expect(unit.readRawControl()).toMatchObject({
			mode: '6',
			stemp: '--',
			shum: '--',
		});
		expect(state).toMatchObject({ mode: 'fan', targetTemperature: null });
	});

	it.each([
		['cool', 17.5],
		['heat', 30.5],
		['auto', 31],
	] as const)(
		'should throw an invalid command error without any SET when %s gets the out-of-range temperature %d',
		async (mode, targetTemperature) => {
			const unit = await startUnit();
			const driver = createLocalHttpDriver({
				host: unit.host,
				timeoutMs: TIMEOUT_MS,
			});

			await expect(
				driver.writeState({ mode, targetTemperature })
			).rejects.toBeInstanceOf(InvalidCommandError);
			expect(unit.receivedCommands()).toEqual([]);
		}
	);

	it('should throw an invalid command error without any request when the temperature is invalid', async () => {
		const driver = createLocalHttpDriver({
			host: UNUSED_HOST,
			timeoutMs: TIMEOUT_MS,
		});

		await expect(
			driver.writeState({ targetTemperature: 21.3 })
		).rejects.toBeInstanceOf(InvalidCommandError);
	});

	it('should throw an invalid command error without any request when a temperature goes with dry mode', async () => {
		const driver = createLocalHttpDriver({
			host: UNUSED_HOST,
			timeoutMs: TIMEOUT_MS,
		});

		await expect(
			driver.writeState({ mode: 'dry', targetTemperature: 21 })
		).rejects.toBeInstanceOf(InvalidCommandError);
	});

	it('should throw an unreachable error and send nothing when the unit does not answer the first read', async () => {
		const unit = await startUnit();
		unit.setReachable(false);
		const driver = createLocalHttpDriver({
			host: unit.host,
			timeoutMs: TIMEOUT_MS,
		});

		await expect(driver.writeState({ isPowered: true })).rejects.toBeInstanceOf(
			UnitUnreachableError
		);
		expect(unit.receivedCommands()).toEqual([]);
	});

	it('should throw an unconfirmed error carrying the sent params when the SET times out', async () => {
		const unit = await startUnit();
		unit.failNextRequest(UNIT_PATHS.setControlInfo, 'hang');
		const driver = createLocalHttpDriver({
			host: unit.host,
			timeoutMs: TIMEOUT_MS,
		});

		const failure = await driver
			.writeState({ isPowered: true })
			.catch((error: unknown) => error);

		expect(failure).toBeInstanceOf(UnitWriteUnconfirmedError);
		expect((failure as UnitWriteUnconfirmedError).sentParams).toMatchObject({
			pow: '1',
		});
	});

	it('should throw an unconfirmed error when the re-read fails after an OK SET', async () => {
		const unit = await startUnit();
		unit.failNextRequest(UNIT_PATHS.controlInfo, 'drop', 1);
		const driver = createLocalHttpDriver({
			host: unit.host,
			timeoutMs: TIMEOUT_MS,
		});

		await expect(driver.writeState({ isPowered: true })).rejects.toBeInstanceOf(
			UnitWriteUnconfirmedError
		);
		expect(unit.readRawControl()['pow']).toBe('1');
	});

	it('should serialize concurrent writes on the same host so no update is lost', async () => {
		const unit = await startUnit();
		const first = createLocalHttpDriver({
			host: unit.host,
			timeoutMs: TIMEOUT_MS,
		});
		const second = createLocalHttpDriver({
			host: unit.host,
			timeoutMs: TIMEOUT_MS,
		});

		await Promise.all([
			first.writeState({ targetTemperature: 22 }),
			second.writeState({ fanRate: 3 }),
		]);

		expect(unit.readRawControl()).toMatchObject({ stemp: '22.0', f_rate: '5' });
	});
});

describe('createLocalHttpDriver special modes', () => {
	async function startDriver(): Promise<{
		readonly unit: FakeDaikinUnit;
		readonly driver: UnitDriver;
	}> {
		const unit = await startUnit();
		const driver = createLocalHttpDriver({
			host: unit.host,
			timeoutMs: TIMEOUT_MS,
		});
		return { unit, driver };
	}

	it('should send powerful with kind 1 and return the re-read state when turning it on', async () => {
		const { unit, driver } = await startDriver();

		const state = await driver.writeSpecialMode('powerful', true);

		expect(unit.receivedCommands()).toEqual([
			{ set_spmode: '1', spmode_kind: '1' },
		]);
		expect(unit.readRawControl()['adv']).toBe('2');
		expect(state.specialModes).toEqual(['powerful']);
	});

	it('should send econo with kind 2 when turning it on', async () => {
		const { unit, driver } = await startDriver();

		const state = await driver.writeSpecialMode('econo', true);

		expect(unit.receivedCommands()).toEqual([
			{ set_spmode: '1', spmode_kind: '2' },
		]);
		expect(state.specialModes).toEqual(['econo']);
	});

	it('should replace the active special mode when turning the other one on', async () => {
		const { driver } = await startDriver();
		await driver.writeSpecialMode('powerful', true);

		const state = await driver.writeSpecialMode('econo', true);

		expect(state.specialModes).toEqual(['econo']);
	});

	it('should clear the special mode when turning it off', async () => {
		const { unit, driver } = await startDriver();
		await driver.writeSpecialMode('econo', true);

		const state = await driver.writeSpecialMode('econo', false);

		expect(unit.receivedCommands().at(-1)).toEqual({
			set_spmode: '0',
			spmode_kind: '2',
		});
		expect(state.specialModes).toEqual([]);
	});

	it('should keep streamer reported by the unit when turning powerful on', async () => {
		const { unit, driver } = await startDriver();
		unit.applyRemoteChange({ adv: '13' });

		const state = await driver.writeSpecialMode('powerful', true);

		expect(state.specialModes).toEqual(['streamer', 'powerful']);
	});

	it('should throw an unconfirmed error carrying the sent params when the special mode request times out', async () => {
		const { unit, driver } = await startDriver();
		unit.failNextRequest(UNIT_PATHS.setSpecialMode, 'hang');

		const failure = await driver
			.writeSpecialMode('powerful', true)
			.catch((error: unknown) => error);

		expect(failure).toBeInstanceOf(UnitWriteUnconfirmedError);
		expect((failure as UnitWriteUnconfirmedError).sentParams).toEqual({
			set_spmode: '1',
			spmode_kind: '1',
		});
	});

	it('should throw an unconfirmed error when the re-read fails after an OK special mode request', async () => {
		const { driver, unit } = await startDriver();
		unit.failNextRequest(UNIT_PATHS.controlInfo, 'drop');

		await expect(
			driver.writeSpecialMode('powerful', true)
		).rejects.toBeInstanceOf(UnitWriteUnconfirmedError);
		expect(unit.readRawControl()['adv']).toBe('2');
	});

	it('should serialize a special mode write with a state write on the same host', async () => {
		const { unit, driver } = await startDriver();

		await Promise.all([
			driver.writeSpecialMode('powerful', true),
			driver.writeState({ targetTemperature: 22 }),
		]);

		expect(unit.readRawControl()).toMatchObject({ adv: '2', stemp: '22.0' });
	});
});

describe('createLocalHttpDriver hostile unit answers', () => {
	const servers: Server[] = [];

	async function startHostileServer(
		handler: (response: ServerResponse) => void
	): Promise<string> {
		const server = createServer((_request, response) => handler(response));
		servers.push(server);
		await new Promise<void>((resolve) =>
			server.listen(0, '127.0.0.1', resolve)
		);
		const address = server.address();
		if (address === null || typeof address === 'string') {
			throw new Error('no TCP address');
		}
		return `127.0.0.1:${address.port}`;
	}

	afterEach(async () => {
		await Promise.all(
			servers
				.splice(0)
				.map(
					(server) =>
						new Promise<void>((resolve) => server.close(() => resolve()))
				)
		);
	});

	it('should fail with a protocol error when the unit redirects', async () => {
		const host = await startHostileServer((response) => {
			response.writeHead(302, { location: 'http://127.0.0.1:1/' });
			response.end();
		});
		const driver = createLocalHttpDriver({ host, timeoutMs: TIMEOUT_MS });

		await expect(driver.readSnapshot()).rejects.toBeInstanceOf(
			UnitProtocolError
		);
	});

	it('should fail with a protocol error when the body is oversized', async () => {
		const host = await startHostileServer((response) => {
			response.writeHead(200);
			response.end('x'.repeat(64 * 1024));
		});
		const driver = createLocalHttpDriver({ host, timeoutMs: TIMEOUT_MS });

		await expect(driver.readSnapshot()).rejects.toBeInstanceOf(
			UnitProtocolError
		);
	});

	it('should throw a rejected error when the unit answers PARAM NG', async () => {
		const host = await startHostileServer((response) => {
			response.writeHead(200);
			response.end('ret=PARAM NG,adv=');
		});
		const driver = createLocalHttpDriver({ host, timeoutMs: TIMEOUT_MS });

		await expect(
			driver.writeSpecialMode('powerful', true)
		).rejects.toBeInstanceOf(UnitRejectedError);
	});

	it('should refuse a host that is not a plain host and port', async () => {
		const driver = createLocalHttpDriver({
			host: 'a@127.0.0.1:1',
			timeoutMs: TIMEOUT_MS,
		});

		await expect(driver.readSnapshot()).rejects.toBeInstanceOf(
			UnitProtocolError
		);
	});
});
