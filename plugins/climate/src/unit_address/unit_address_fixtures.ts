/**
 * Example addresses for the tests of the address validation: the private ranges and their edges, which is why this file
 * is the only one the privacy test skips. They are plain examples, none is the address of a real unit.
 */
export const UnitAddressFixtures = {
	privateClassA: '10.20.30.40',
	privateClassBLow: '172.16.0.1',
	privateClassBHigh: '172.31.255.254',
	privateClassC: '192.168.1.50',
	justBelowClassB: '172.15.0.1',
	justAboveClassB: '172.32.0.1',
	publicAddress: '8.8.8.8',
	linkLocalAddress: '169.254.1.1',
	documentationAddress: '192.0.2.10',
	/** Texts that look like a private address without being a valid IPv4 literal. */
	malformedAddresses: [
		'10.20.30.40.50',
		'10.20.30.256',
		'10.20.030.40',
		'10.20.30.40:80',
		'http://10.20.30.40',
		'10.20.30.-1',
		'10.20.30.4a',
	],
} as const;
