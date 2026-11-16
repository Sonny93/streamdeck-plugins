import { describe, expect, it, vi } from 'vitest';

import { createFakeUnitDriver } from '../climate/create_fake_unit_driver';
import { UnitProtocolError } from '../daikin/errors/unit_protocol_error';
import { UnitUnreachableError } from '../daikin/errors/unit_unreachable_error';
import type { UnitDriver } from '../daikin/unit_driver';
import type { ApiFamily } from '../daikin/unit_types';
import { saveUnitAddress } from './save_unit_address';
import { UnitAddressFixtures } from './unit_address_fixtures';

const ADDRESS = UnitAddressFixtures.privateClassC;

function buildDriver(readIdentity: UnitDriver['readIdentity']): UnitDriver {
	return { ...createFakeUnitDriver().driver, readIdentity };
}

function identityOf(apiFamily: ApiFamily): UnitDriver['readIdentity'] {
	return () =>
		Promise.resolve({
			name: 'Unit',
			mac: 'fixture',
			firmwareVersion: '1',
			apiFamily,
		});
}

function buildDependencies(driver: UnitDriver) {
	return {
		createDriver: vi.fn(() => driver),
		persistHost: vi.fn(() => Promise.resolve()),
		applyHost: vi.fn(),
		onError: vi.fn(),
	};
}

describe('saveUnitAddress', () => {
	it('should persist the address and hand it to the hub when the unit has the local API', async () => {
		const dependencies = buildDependencies(
			buildDriver(identityOf('local-http'))
		);

		const outcome = await saveUnitAddress(` ${ADDRESS} `, dependencies);

		expect(outcome).toBe('saved');
		expect(dependencies.createDriver).toHaveBeenCalledWith(ADDRESS);
		expect(dependencies.persistHost).toHaveBeenCalledWith(ADDRESS);
		expect(dependencies.applyHost).toHaveBeenCalledWith(ADDRESS);
	});

	it('should refuse without calling the unit when the address is not a private IPv4 literal', async () => {
		const dependencies = buildDependencies(
			buildDriver(identityOf('local-http'))
		);

		const outcome = await saveUnitAddress(
			UnitAddressFixtures.publicAddress,
			dependencies
		);

		expect(outcome).toBe('invalid');
		expect(dependencies.createDriver).not.toHaveBeenCalled();
		expect(dependencies.persistHost).not.toHaveBeenCalled();
	});

	it('should report no answer and save nothing when the unit is unreachable', async () => {
		const dependencies = buildDependencies(
			buildDriver(() => Promise.reject(new UnitUnreachableError(ADDRESS)))
		);

		const outcome = await saveUnitAddress(ADDRESS, dependencies);

		expect(outcome).toBe('no-answer');
		expect(dependencies.persistHost).not.toHaveBeenCalled();
		expect(dependencies.applyHost).not.toHaveBeenCalled();
	});

	it('should report an incompatible unit when it answers with something else than the Daikin protocol', async () => {
		const dependencies = buildDependencies(
			buildDriver(() => Promise.reject(new UnitProtocolError('Not Daikin')))
		);

		const outcome = await saveUnitAddress(ADDRESS, dependencies);

		expect(outcome).toBe('incompatible');
		expect(dependencies.applyHost).not.toHaveBeenCalled();
	});

	it.each<ApiFamily>(['cloud-only', 'unknown'])(
		'should report an incompatible unit when its API family is %s',
		async (apiFamily) => {
			const dependencies = buildDependencies(
				buildDriver(identityOf(apiFamily))
			);

			const outcome = await saveUnitAddress(ADDRESS, dependencies);

			expect(outcome).toBe('incompatible');
			expect(dependencies.persistHost).not.toHaveBeenCalled();
		}
	);

	it('should not hand the address to the hub when persisting it fails', async () => {
		const dependencies = {
			...buildDependencies(buildDriver(identityOf('local-http'))),
			persistHost: vi.fn(() => Promise.reject(new Error('Disk full'))),
		};

		await expect(saveUnitAddress(ADDRESS, dependencies)).rejects.toThrow(
			'Disk full'
		);
		expect(dependencies.applyHost).not.toHaveBeenCalled();
	});
});
