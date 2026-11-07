import { encodeZipRecord } from './encode_zip_record.ts';
import { ZipFormat } from './zip_format.ts';

/** Builds the central directory header of an entry, which points back to its local header. */
export function buildCentralHeader(
	options: Readonly<{
		name: Buffer;
		crc: number;
		size: number;
		offset: number;
		isDirectory: boolean;
	}>
): Buffer {
	const { name, crc, size, offset, isDirectory } = options;
	return encodeZipRecord({
		fields: [
			[ZipFormat.doubleWord, ZipFormat.centralHeaderSignature],
			[ZipFormat.word, ZipFormat.version],
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
			[ZipFormat.word, ZipFormat.empty],
			[ZipFormat.word, ZipFormat.empty],
			[ZipFormat.word, ZipFormat.empty],
			[
				ZipFormat.doubleWord,
				isDirectory ? ZipFormat.directoryAttribute : ZipFormat.empty,
			],
			[ZipFormat.doubleWord, offset],
		],
		trailer: name,
	});
}
