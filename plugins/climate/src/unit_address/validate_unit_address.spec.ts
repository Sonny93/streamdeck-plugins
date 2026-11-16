import { describe, expect, it } from 'vitest';

import { UnitAddressFixtures } from './unit_address_fixtures';
import { validateUnitAddress } from './validate_unit_address';

describe('validateUnitAddress', () => {
	it.each([
		UnitAddressFixtures.privateClassA,
		UnitAddressFixtures.privateClassBLow,
		UnitAddressFixtures.privateClassBHigh,
		UnitAddressFixtures.privateClassC,
	])('should accept %s when it is in a private range', (address) => {
		expect(validateUnitAddress(address)).toBe(address);
	});

	it('should return the address without surrounding spaces when it has some', () => {
		expect(
			validateUnitAddress(`  ${UnitAddressFixtures.privateClassC}\n`)
		).toBe(UnitAddressFixtures.privateClassC);
	});

	it.each([
		UnitAddressFixtures.justBelowClassB,
		UnitAddressFixtures.justAboveClassB,
		UnitAddressFixtures.publicAddress,
		UnitAddressFixtures.linkLocalAddress,
		UnitAddressFixtures.documentationAddress,
		'127.0.0.1',
	])('should refuse %s when it is outside the private ranges', (address) => {
		expect(validateUnitAddress(address)).toBeUndefined();
	});

	it.each([
		'',
		'unit.local',
		'::1',
		'10.20.30',
		...UnitAddressFixtures.malformedAddresses,
	])('should refuse "%s" when it is not an IPv4 literal', (address) => {
		expect(validateUnitAddress(address)).toBeUndefined();
	});
});
