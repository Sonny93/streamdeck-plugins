import { afterEach, describe, expect, it } from 'vitest';

import { UnitProtocolError } from '../errors/unit_protocol_error';
import type { FakeUnitOptions } from '../fake/fake_unit_model';
import {
	startFakeDaikinUnit,
	type FakeDaikinUnit,
} from '../fake/start_fake_daikin_unit';
import { createLocalHttpDriver } from './create_local_http_driver';

const TIMEOUT_MS = 200;
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

describe('createLocalHttpDriver readEnergy', () => {
	it('should read the energy of the fake unit when it answers get_week_power_ex', async () => {
		const unit = await startUnit();
		const driver = createLocalHttpDriver({
			host: unit.host,
			timeoutMs: TIMEOUT_MS,
		});

		const energy = await driver.readEnergy();

		expect(energy).toEqual({
			heat: { todayKilowattHours: 0, lastSevenDaysKilowattHours: 3.1 },
			cool: { todayKilowattHours: 0, lastSevenDaysKilowattHours: 0.6 },
		});
	});

	it('should throw a protocol error when a list is malformed', async () => {
		const unit = await startUnit({
			weekPowerEx: { week_heat: '1/2', week_cool: '1/2' },
		});
		const driver = createLocalHttpDriver({
			host: unit.host,
			timeoutMs: TIMEOUT_MS,
		});

		await expect(driver.readEnergy()).rejects.toBeInstanceOf(UnitProtocolError);
	});
});
