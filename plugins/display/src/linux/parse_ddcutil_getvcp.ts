import type { VcpReply } from '../displays/vcp_reply';

const HEX_RADIX = 16;
const DECIMAL_RADIX = 10;
const CONTINUOUS_LINE = /^VCP ([0-9A-F]{2}) C (\d+) (\d+)$/iu;
const NON_CONTINUOUS_LINE = /^VCP ([0-9A-F]{2}) (?:SNC|CNC) x([0-9A-F]+)$/iu;

/**
 * Reads the values out of the `--brief` output of `ddcutil getvcp`, such as `VCP 10 C 50 100` (current and maximum)
 * and `VCP D6 SNC x01`; a non-continuous value has no maximum, so it is 0. Features the monitor refuses (`ERR`) are left out.
 */
export function parseDdcutilGetvcp(output: string): Map<number, VcpReply> {
	const replies = new Map<number, VcpReply>();
	for (const line of output.split('\n')) {
		const trimmed = line.trim();
		const continuous = CONTINUOUS_LINE.exec(trimmed);
		if (continuous?.[1] !== undefined) {
			replies.set(Number.parseInt(continuous[1], HEX_RADIX), {
				current: Number.parseInt(continuous[2] ?? '', DECIMAL_RADIX),
				maximum: Number.parseInt(continuous[3] ?? '', DECIMAL_RADIX),
			});
			continue;
		}
		const nonContinuous = NON_CONTINUOUS_LINE.exec(trimmed);
		if (nonContinuous?.[1] !== undefined) {
			replies.set(Number.parseInt(nonContinuous[1], HEX_RADIX), {
				current: Number.parseInt(nonContinuous[2] ?? '', HEX_RADIX),
				maximum: 0,
			});
		}
	}
	return replies;
}
