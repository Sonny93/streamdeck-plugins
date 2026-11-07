import { buildDirectoryEntry } from 'deck-kit/zip/build_directory_entry';
import { buildZip } from 'deck-kit/zip/build_zip';
import { crc32, deflateRawSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';

import { readZip } from './read_zip.ts';
import { ZipReadError } from './zip_read_error.ts';

const DEFLATE_METHOD = 8;
const UNSUPPORTED_METHOD = 12;
const ENCRYPTED_FLAG = 1;
const LOCAL_HEADER_SIZE = 30;
const CENTRAL_HEADER_SIZE = 46;

type RawEntry = Readonly<{
	name: string;
	content: string;
	method: number;
	flags: number;
}>;

function buildRawEntry(overrides: Partial<RawEntry>): RawEntry {
	return {
		name: 'a.txt',
		content: 'hello hello hello hello',
		method: DEFLATE_METHOD,
		flags: 0,
		...overrides,
	};
}

function buildRawArchive(entry: RawEntry): Buffer {
	const name = Buffer.from(entry.name);
	const content = Buffer.from(entry.content);
	const stored = entry.method === 0 ? content : deflateRawSync(content);
	const local = Buffer.alloc(LOCAL_HEADER_SIZE);
	local.writeUInt32LE(0x04034b50, 0);
	local.writeUInt16LE(entry.flags, 6);
	local.writeUInt16LE(entry.method, 8);
	local.writeUInt32LE(crc32(content), 14);
	local.writeUInt32LE(stored.length, 18);
	local.writeUInt32LE(content.length, 22);
	local.writeUInt16LE(name.length, 26);
	const central = Buffer.alloc(CENTRAL_HEADER_SIZE);
	central.writeUInt32LE(0x02014b50, 0);
	central.writeUInt16LE(entry.flags, 8);
	central.writeUInt16LE(entry.method, 10);
	central.writeUInt32LE(crc32(content), 16);
	central.writeUInt32LE(stored.length, 20);
	central.writeUInt32LE(content.length, 24);
	central.writeUInt16LE(name.length, 28);
	const end = Buffer.alloc(22);
	end.writeUInt32LE(0x06054b50, 0);
	end.writeUInt16LE(1, 8);
	end.writeUInt16LE(1, 10);
	end.writeUInt32LE(CENTRAL_HEADER_SIZE + name.length, 12);
	end.writeUInt32LE(LOCAL_HEADER_SIZE + name.length + stored.length, 16);
	return Buffer.concat([local, name, stored, central, name, end]);
}

describe('readZip', () => {
	it('should read back the entries written by buildZip', () => {
		const archive = buildZip({
			entries: [
				buildDirectoryEntry({ path: 'folder' }),
				{ name: 'folder/a.txt', data: Buffer.from('a') },
				{ name: 'b.txt', data: Buffer.from('b') },
			],
		});

		const entries = readZip({ archive });

		expect(
			entries.map((entry) => [
				entry.name,
				Buffer.from(entry.data).toString('utf8'),
			])
		).toEqual([
			['folder/', ''],
			['folder/a.txt', 'a'],
			['b.txt', 'b'],
		]);
	});

	it('should inflate a deflated entry', () => {
		const archive = buildRawArchive(buildRawEntry({}));

		const entries = readZip({ archive });

		expect(
			entries.map((entry) => Buffer.from(entry.data).toString('utf8'))
		).toEqual(['hello hello hello hello']);
	});

	it('should fail when the data is not a zip archive', () => {
		expect(() => readZip({ archive: Buffer.from('not a zip') })).toThrow(
			ZipReadError
		);
	});

	it('should fail on an encrypted entry', () => {
		const archive = buildRawArchive(buildRawEntry({ flags: ENCRYPTED_FLAG }));

		expect(() => readZip({ archive })).toThrow(/encrypted/);
	});

	it('should fail on an unsupported compression method', () => {
		const archive = buildRawArchive(
			buildRawEntry({ method: UNSUPPORTED_METHOD })
		);

		expect(() => readZip({ archive })).toThrow(/compression method 12/);
	});

	it('should fail when an entry does not match its checksum', () => {
		const archive = buildZip({
			entries: [{ name: 'a.txt', data: Buffer.from('content') }],
		});
		archive[LOCAL_HEADER_SIZE + 'a.txt'.length] = 0;

		expect(() => readZip({ archive })).toThrow(/checksum/);
	});

	it('should fail when the archive is truncated', () => {
		const archive = buildZip({
			entries: [{ name: 'a.txt', data: Buffer.from('content') }],
		});

		expect(() => readZip({ archive: archive.subarray(0, 40) })).toThrow(
			ZipReadError
		);
	});
});
