const PRIVATE_ADDRESS =
	/\b(?:10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(?:1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3})\b/gu;
const SEPARATED_MAC = /\b(?:[0-9A-Fa-f]{2}[:-]){5}[0-9A-Fa-f]{2}\b/gu;
const WIRE_MAC = /\bmac=([0-9A-Fa-f]{12})\b/giu;
/** The prefix the IEEE reserves for documentation: the MAC of the fake unit starts with it. */
const DOCUMENTATION_MAC_PREFIX = '00005E0053';

/** Lists the private network addresses and MAC addresses in a text, except the documentation MAC prefix. */
export function findPrivacyLeaks(text: string): readonly string[] {
	const wireMacs = [...text.matchAll(WIRE_MAC)]
		.map((match) => match[1] ?? '')
		.filter((mac) => !mac.toUpperCase().startsWith(DOCUMENTATION_MAC_PREFIX));
	return [
		...(text.match(PRIVATE_ADDRESS) ?? []),
		...(text.match(SEPARATED_MAC) ?? []),
		...wireMacs,
	];
}
