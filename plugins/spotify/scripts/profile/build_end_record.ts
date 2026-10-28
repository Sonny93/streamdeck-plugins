import { ZipFormat } from './zip_format.ts';
import { encodeZipRecord } from './encode_zip_record.ts';

/** Builds the end of central directory record, which closes the archive. */
export function buildEndRecord(
	options: Readonly<{
		entryCount: number;
		centralSize: number;
		centralOffset: number;
	}>
): Buffer {
	return encodeZipRecord({
		fields: [
			[ZipFormat.doubleWord, ZipFormat.endRecordSignature],
			[ZipFormat.word, ZipFormat.empty],
			[ZipFormat.word, ZipFormat.empty],
			[ZipFormat.word, options.entryCount],
			[ZipFormat.word, options.entryCount],
			[ZipFormat.doubleWord, options.centralSize],
			[ZipFormat.doubleWord, options.centralOffset],
			[ZipFormat.word, ZipFormat.empty],
		],
	});
}
