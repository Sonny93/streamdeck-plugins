const OCTET_COUNT = 4;
const MAXIMUM_OCTET = 255;
const OCTET_PATTERN = /^(?:0|[1-9]\d{0,2})$/u;

type PrivateRange = Readonly<{
	firstOctet: number;
	secondOctetMinimum: number;
	secondOctetMaximum: number;
}>;

/** The private IPv4 ranges of RFC 1918, as the bounds of their leading octets. */
const PRIVATE_RANGES: readonly PrivateRange[] = [
	{ firstOctet: 10, secondOctetMinimum: 0, secondOctetMaximum: MAXIMUM_OCTET },
	{ firstOctet: 172, secondOctetMinimum: 16, secondOctetMaximum: 31 },
	{ firstOctet: 192, secondOctetMinimum: 168, secondOctetMaximum: 168 },
];

function parseOctets(address: string): readonly number[] | undefined {
	const parts = address.split('.');
	if (
		parts.length !== OCTET_COUNT ||
		!parts.every((part) => OCTET_PATTERN.test(part))
	) {
		return undefined;
	}
	const octets = parts.map(Number);
	return octets.every((octet) => octet <= MAXIMUM_OCTET) ? octets : undefined;
}

function isPrivate(octets: readonly number[]): boolean {
	const [first = -1, second = -1] = octets;
	return PRIVATE_RANGES.some(
		(range) =>
			range.firstOctet === first &&
			second >= range.secondOctetMinimum &&
			second <= range.secondOctetMaximum
	);
}

/**
 * Checks what a user typed as the address of the unit: an IPv4 literal in a private range, without port.
 * Returns the address cleaned of surrounding spaces, or `undefined` when it is not acceptable.
 * The plugin only ever talks to a unit on the local network, so a typed host name or public address is refused.
 */
export function validateUnitAddress(input: string): string | undefined {
	const address = input.trim();
	const octets = parseOctets(address);
	return octets !== undefined && isPrivate(octets) ? address : undefined;
}
