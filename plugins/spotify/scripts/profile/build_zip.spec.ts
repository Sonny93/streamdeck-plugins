import { crc32 } from 'node:zlib';
import { describe, expect, it } from 'vitest';

import { buildZip } from './build_zip.ts';
import type { ZipEntry } from './zip_entry.ts';

const END_RECORD_SIZE = 22;
const END_RECORD_ENTRY_COUNT = 10;
const END_RECORD_CENTRAL_OFFSET = 16;
const CENTRAL_HEADER_SIZE = 46;
const CENTRAL_CRC = 16;
const CENTRAL_SIZE = 24;
const CENTRAL_NAME_LENGTH = 28;
const CENTRAL_EXTRA_LENGTH = 30;
const CENTRAL_COMMENT_LENGTH = 32;
const CENTRAL_LOCAL_OFFSET = 42;
const LOCAL_HEADER_SIZE = 30;
const LOCAL_NAME_LENGTH = 26;
const LOCAL_EXTRA_LENGTH = 28;

type ParsedEntry = Readonly<{
	name: string;
	crc: number;
	data: Buffer;
}>;

function readEntries(archive: Buffer): ParsedEntry[] {
	const end = archive.length - END_RECORD_SIZE;
	const entryCount = archive.readUInt16LE(end + END_RECORD_ENTRY_COUNT);
	let cursor = archive.readUInt32LE(end + END_RECORD_CENTRAL_OFFSET);
	const entries: ParsedEntry[] = [];
	for (let index = 0; index < entryCount; index += 1) {
		const nameLength = archive.readUInt16LE(cursor + CENTRAL_NAME_LENGTH);
		const size = archive.readUInt32LE(cursor + CENTRAL_SIZE);
		const localOffset = archive.readUInt32LE(cursor + CENTRAL_LOCAL_OFFSET);
		const dataStart =
			localOffset +
			LOCAL_HEADER_SIZE +
			archive.readUInt16LE(localOffset + LOCAL_NAME_LENGTH) +
			archive.readUInt16LE(localOffset + LOCAL_EXTRA_LENGTH);
		entries.push({
			name: archive.toString(
				'utf8',
				cursor + CENTRAL_HEADER_SIZE,
				cursor + CENTRAL_HEADER_SIZE + nameLength
			),
			crc: archive.readUInt32LE(cursor + CENTRAL_CRC),
			data: archive.subarray(dataStart, dataStart + size),
		});
		cursor +=
			CENTRAL_HEADER_SIZE +
			nameLength +
			archive.readUInt16LE(cursor + CENTRAL_EXTRA_LENGTH) +
			archive.readUInt16LE(cursor + CENTRAL_COMMENT_LENGTH);
	}
	return entries;
}

const entries: ZipEntry[] = [
	{ name: 'Profiles/', data: new Uint8Array() },
	{ name: 'Profiles/manifest.json', data: Buffer.from('{"Name":"Deck"}') },
	{ name: 'package.json', data: Buffer.from('{}') },
];

describe('buildZip', () => {
	it('should list every entry, in order, with the CRC and the data it was given', () => {
		const parsed = readEntries(buildZip({ entries }));

		expect(parsed.map((entry) => entry.name)).toEqual(
			entries.map((entry) => entry.name)
		);
		for (const [index, entry] of parsed.entries()) {
			const source = entries[index]?.data ?? new Uint8Array();
			expect(entry.crc).toBe(crc32(source));
			expect(entry.data.equals(Buffer.from(source))).toBe(true);
		}
	});

	it('should give the same bytes for the same entries', () => {
		expect(buildZip({ entries }).equals(buildZip({ entries }))).toBe(true);
	});

	it('should build an archive with no entries', () => {
		expect(readEntries(buildZip({ entries: [] }))).toEqual([]);
	});
});
