import { encodeZipRecord } from './encode_zip_record.ts';
import { ZipFormat } from './zip_format.ts';

/** Builds the local file header that precedes the stored data of an entry. */
export function buildLocalHeader(
	options: Readonly<{ name: Buffer; crc: number; size: number }>
): Buffer {
	const { name, crc, size } = options;
	return encodeZipRecord({
		fields: [
			[ZipFormat.doubleWord, ZipFormat.localHeaderSignature],
			[ZipFormat.word, ZipFormat.version],
			[ZipFormat.word, ZipFormat.utf8Flag],
			[ZipFormat.word, ZipFormat.storeMethod],
			[ZipFormat.word, ZipFormat.time],
			[ZipFormat.word, ZipFormat.date],
			[ZipFormat.doubleWord, crc],
			[ZipFormat.doubleWord, size],
			[ZipFormat.doubleWord, size],
			[ZipFormat.word, name.length],
			[ZipFormat.word, ZipFormat.empty],
		],
		trailer: name,
	});
}
