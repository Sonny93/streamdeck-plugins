import type { VcpCapabilities } from './vcp_capabilities';

const VCP_SECTION = 'vcp(';
const HEX_RADIX = 16;

/**
 * Reads the `vcp(...)` section of an MCCS capabilities string, such as `vcp(10 12 D6(01 04))`.
 * Returns an empty map when the string has no such section.
 */
export function parseVcpCapabilities(capabilities: string): VcpCapabilities {
	const codes = new Map<number, number[]>();
	const start = capabilities.toLowerCase().indexOf(VCP_SECTION);
	if (start === -1) {
		return codes;
	}
	let depth = 1;
	let lastCode: number | undefined;
	const tokens = capabilities
		.slice(start + VCP_SECTION.length)
		.matchAll(/[0-9a-f]+|[()]/giu);
	for (const [token] of tokens) {
		if (token === '(') {
			depth += 1;
		} else if (token === ')') {
			depth -= 1;
			if (depth === 0) {
				break;
			}
		} else if (depth === 1) {
			lastCode = Number.parseInt(token, HEX_RADIX);
			codes.set(lastCode, []);
		} else if (depth === 2 && lastCode !== undefined) {
			codes.get(lastCode)?.push(Number.parseInt(token, HEX_RADIX));
		}
	}
	return codes;
}
