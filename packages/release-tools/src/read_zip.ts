import type { ZipEntry } from 'deck-kit/zip/zip_entry';

import { findEndRecord } from './find_end_record.ts';
import { readZipEntry } from './read_zip_entry.ts';
import { ZipReadError } from './zip_read_error.ts';
import { ZipReadLayout } from './zip_read_layout.ts';

function readEntries(options: Readonly<{ archive: Buffer }>): ZipEntry[] {
	const { archive } = options;
	const endRecord = findEndRecord({ archive });
	const entryCount = archive.readUInt16LE(
		endRecord + ZipReadLayout.endRecordEntryCount
	);
	const firstCentralOffset = archive.readUInt32LE(
		endRecord + ZipReadLayout.endRecordCentralOffset
	);
	if (
		entryCount === ZipReadLayout.zip64Word ||
		firstCentralOffset === ZipReadLayout.zip64DoubleWord
	) {
		throw new ZipReadError({
			reason: 'The archive needs zip64, which is not supported',
		});
	}
	const entries: ZipEntry[] = [];
	let centralOffset = firstCentralOffset;
	for (let index = 0; index < entryCount; index += 1) {
		const { entry, nextCentralOffset } = readZipEntry({
			archive,
			centralOffset,
		});
		entries.push(entry);
		centralOffset = nextCentralOffset;
	}
	return entries;
}

/**
 * Reads every entry of a zip archive, in central directory order. Supports stored and deflated entries only,
 * and fails with a `ZipReadError` on anything else, on a damaged archive or on a checksum mismatch.
 */
export function readZip(options: Readonly<{ archive: Buffer }>): ZipEntry[] {
	try {
		return readEntries(options);
	} catch (error) {
		if (error instanceof RangeError) {
			throw new ZipReadError({ reason: 'The archive is truncated or damaged' });
		}
		throw error;
	}
}
