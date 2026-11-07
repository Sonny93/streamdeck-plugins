import type { ZipField } from './zip_field.ts';

/** Encodes the fields of a zip record one after the other, followed by the trailing bytes (the entry name for a header). */
export function encodeZipRecord(
	options: Readonly<{ fields: readonly ZipField[]; trailer?: Buffer }>
): Buffer {
	const { fields, trailer = Buffer.alloc(0) } = options;
	const fieldsLength = fields.reduce((total, [width]) => total + width, 0);
	const record = Buffer.alloc(fieldsLength + trailer.length);
	let offset = 0;
	for (const [width, value] of fields) {
		record.writeUIntLE(value, offset, width);
		offset += width;
	}
	trailer.copy(record, offset);
	return record;
}
