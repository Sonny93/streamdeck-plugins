import type { Guid } from './guid';

const GUID_PATTERN =
	/^([0-9a-f]{8})-([0-9a-f]{4})-([0-9a-f]{4})-([0-9a-f]{4})-([0-9a-f]{12})$/i;
const HEX_RADIX = 16;
const BYTE_HEX_LENGTH = 2;

function splitBytes(hex: string): number[] {
	const bytes: number[] = [];
	for (let index = 0; index < hex.length; index += BYTE_HEX_LENGTH) {
		bytes.push(
			Number.parseInt(hex.slice(index, index + BYTE_HEX_LENGTH), HEX_RADIX)
		);
	}
	return bytes;
}

/** Turns a GUID written as `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx` into the fields of the Win32 `GUID` struct; throws on any other text. */
export function parseGuid(text: string): Guid {
	const match = GUID_PATTERN.exec(text);
	if (match === null) {
		throw new TypeError(`"${text}" is not a GUID.`);
	}
	const [, data1 = '', data2 = '', data3 = '', clockSequence = '', node = ''] =
		match;
	return {
		Data1: Number.parseInt(data1, HEX_RADIX),
		Data2: Number.parseInt(data2, HEX_RADIX),
		Data3: Number.parseInt(data3, HEX_RADIX),
		Data4: splitBytes(`${clockSequence}${node}`),
	};
}
