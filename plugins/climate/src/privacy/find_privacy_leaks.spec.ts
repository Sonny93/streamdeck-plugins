import { describe, expect, it } from 'vitest';

import { findPrivacyLeaks } from './find_privacy_leaks';

/** Built from pieces so this file does not hold the text it looks for. */
function join(parts: readonly string[], separator: string): string {
	return parts.join(separator);
}

describe('findPrivacyLeaks', () => {
	it.each([
		join(['10', '1', '2', '3'], '.'),
		join(['172', '16', '0', '9'], '.'),
		join(['172', '31', '255', '1'], '.'),
		join(['192', '168', '0', '10'], '.'),
	])('should find the private address %s', (address) => {
		expect(findPrivacyLeaks(`host ${address}:80`)).toEqual([address]);
	});

	it.each([
		join(['192', '0', '2', '10'], '.'),
		join(['172', '32', '0', '1'], '.'),
		join(['127', '0', '0', '1'], '.'),
		join(['8', '8', '8', '8'], '.'),
	])('should ignore the address %s outside the private ranges', (address) => {
		expect(findPrivacyLeaks(address)).toEqual([]);
	});

	it.each([
		join(['a4', '5e', '60', 'c2', '11', '9f'], ':'),
		join(['A4', '5E', '60', 'C2', '11', '9F'], '-'),
	])('should find the MAC address %s', (mac) => {
		expect(findPrivacyLeaks(`mac ${mac}`)).toEqual([mac]);
	});

	it('should find the MAC address of a Daikin reply', () => {
		const mac = ['a45e', '60c2', '119f'].join('');

		expect(findPrivacyLeaks(`type=aircon,mac=${mac},ssid=x`)).toEqual([mac]);
	});

	it('should ignore a MAC address with the documentation prefix', () => {
		const mac = ['00005E0053', '01'].join('');

		expect(findPrivacyLeaks(`mac=${mac}`)).toEqual([]);
	});
});
