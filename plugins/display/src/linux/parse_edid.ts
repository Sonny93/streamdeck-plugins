import type { EdidInfo } from './edid_info';

const BLOCK_LENGTH = 128;
const HEADER = [0x00, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0x00] as const;
const MANUFACTURER_OFFSET = 8;
const PRODUCT_CODE_OFFSET = 10;
const SERIAL_NUMBER_OFFSET = 12;
const DESCRIPTOR_OFFSETS = [54, 72, 90, 108] as const;
const DESCRIPTOR_LENGTH = 18;
const DESCRIPTOR_TEXT_OFFSET = 5;
const MODEL_NAME_TAG = 0xfc;
const SERIAL_TEXT_TAG = 0xff;
const LINE_FEED = 0x0a;
const BYTE_BITS = 8;
const LETTER_BITS = 5;
const LETTER_POSITIONS = [2, 1, 0] as const;
const LETTER_MASK = 0b11111;
const LETTER_BASE = 64;
const HEX_RADIX = 16;
const PRODUCT_CODE_DIGITS = 4;

function readManufacturerId(edid: Uint8Array): string {
	const packed =
		((edid[MANUFACTURER_OFFSET] ?? 0) << BYTE_BITS) |
		(edid[MANUFACTURER_OFFSET + 1] ?? 0);
	return LETTER_POSITIONS.map((index) =>
		String.fromCodePoint(
			((packed >> (index * LETTER_BITS)) & LETTER_MASK) + LETTER_BASE
		)
	).join('');
}

function readDescriptorText(edid: Uint8Array, tag: number): string | undefined {
	for (const offset of DESCRIPTOR_OFFSETS) {
		const descriptor = edid.subarray(offset, offset + DESCRIPTOR_LENGTH);
		const isText =
			descriptor[0] === 0 && descriptor[1] === 0 && descriptor[3] === tag;
		if (!isText) {
			continue;
		}
		const text = descriptor.subarray(DESCRIPTOR_TEXT_OFFSET);
		const end = text.indexOf(LINE_FEED);
		const content = end === -1 ? text : text.subarray(0, end);
		const decoded = new TextDecoder('ascii').decode(content).trim();
		return decoded === '' ? undefined : decoded;
	}
	return undefined;
}

function readSerialNumber(edid: Uint8Array): string | undefined {
	const view = new DataView(edid.buffer, edid.byteOffset, edid.byteLength);
	const serialNumber = view.getUint32(SERIAL_NUMBER_OFFSET, true);
	return serialNumber === 0 ? undefined : String(serialNumber);
}

/** Reads the manufacturer id, product code, serial and model name of an EDID; `undefined` when the bytes are not an EDID base block. */
export function parseEdid(edid: Uint8Array): EdidInfo | undefined {
	const hasHeader = HEADER.every((byte, index) => edid[index] === byte);
	if (edid.length < BLOCK_LENGTH || !hasHeader) {
		return undefined;
	}
	const productCode = new DataView(
		edid.buffer,
		edid.byteOffset,
		edid.byteLength
	).getUint16(PRODUCT_CODE_OFFSET, true);
	return {
		manufacturerId: readManufacturerId(edid),
		productCode: productCode
			.toString(HEX_RADIX)
			.toUpperCase()
			.padStart(PRODUCT_CODE_DIGITS, '0'),
		serial: readDescriptorText(edid, SERIAL_TEXT_TAG) ?? readSerialNumber(edid),
		model: readDescriptorText(edid, MODEL_NAME_TAG),
	};
}
