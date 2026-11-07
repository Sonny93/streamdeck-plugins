import type { ZipEntry } from 'deck-kit/zip/zip_entry';
import { ZipFormat } from 'deck-kit/zip/zip_format';
import { crc32, inflateRawSync } from 'node:zlib';

import { ZipReadError } from './zip_read_error.ts';
import { ZipReadLayout } from './zip_read_layout.ts';

function inflateData(
	options: Readonly<{ compressed: Buffer; size: number; name: string }>
): Buffer {
	if (options.size === 0) {
		return Buffer.alloc(0);
	}
	try {
		return inflateRawSync(options.compressed, {
			maxOutputLength: options.size,
		});
	} catch {
		throw new ZipReadError({
			reason: `${options.name} cannot be decompressed`,
		});
	}
}

function assertSupported(
	options: Readonly<{
		name: string;
		flags: number;
		method: number;
		compressedSize: number;
		size: number;
	}>
): void {
	const { name, flags, method, compressedSize, size } = options;
	if (flags & ZipReadLayout.encryptedFlag) {
		throw new ZipReadError({ reason: `${name} is encrypted` });
	}
	if (
		method !== ZipFormat.storeMethod &&
		method !== ZipReadLayout.deflateMethod
	) {
		throw new ZipReadError({
			reason: `${name} uses the unsupported compression method ${method}`,
		});
	}
	if (
		compressedSize === ZipReadLayout.zip64DoubleWord ||
		size === ZipReadLayout.zip64DoubleWord
	) {
		throw new ZipReadError({
			reason: `${name} needs zip64, which is not supported`,
		});
	}
}

function readCompressedData(
	options: Readonly<{
		archive: Buffer;
		localOffset: number;
		compressedSize: number;
		name: string;
	}>
): Buffer {
	const { archive, localOffset, compressedSize, name } = options;
	if (archive.readUInt32LE(localOffset) !== ZipFormat.localHeaderSignature) {
		throw new ZipReadError({ reason: `${name} has no local header` });
	}
	const dataStart =
		localOffset +
		ZipReadLayout.localHeaderSize +
		archive.readUInt16LE(localOffset + ZipReadLayout.localNameLength) +
		archive.readUInt16LE(localOffset + ZipReadLayout.localExtraLength);
	if (dataStart + compressedSize > archive.length) {
		throw new ZipReadError({ reason: `${name} is truncated` });
	}
	return archive.subarray(dataStart, dataStart + compressedSize);
}

/** Reads the entry whose central directory header starts at `centralOffset`, checking its size and CRC. */
export function readZipEntry(
	options: Readonly<{ archive: Buffer; centralOffset: number }>
): Readonly<{ entry: ZipEntry; nextCentralOffset: number }> {
	const { archive, centralOffset } = options;
	if (
		archive.readUInt32LE(centralOffset) !== ZipFormat.centralHeaderSignature
	) {
		throw new ZipReadError({ reason: 'The central directory is damaged' });
	}
	const nameLength = archive.readUInt16LE(
		centralOffset + ZipReadLayout.centralNameLength
	);
	const nameStart = centralOffset + ZipReadLayout.centralHeaderSize;
	const name = archive.toString('utf8', nameStart, nameStart + nameLength);
	const method = archive.readUInt16LE(
		centralOffset + ZipReadLayout.centralMethod
	);
	const compressedSize = archive.readUInt32LE(
		centralOffset + ZipReadLayout.centralCompressedSize
	);
	const size = archive.readUInt32LE(centralOffset + ZipReadLayout.centralSize);
	assertSupported({
		name,
		flags: archive.readUInt16LE(centralOffset + ZipReadLayout.centralFlags),
		method,
		compressedSize,
		size,
	});
	const compressed = readCompressedData({
		archive,
		localOffset: archive.readUInt32LE(
			centralOffset + ZipReadLayout.centralLocalOffset
		),
		compressedSize,
		name,
	});
	const data =
		method === ZipFormat.storeMethod
			? compressed
			: inflateData({ compressed, size, name });
	if (
		data.length !== size ||
		crc32(data) !==
			archive.readUInt32LE(centralOffset + ZipReadLayout.centralCrc)
	) {
		throw new ZipReadError({ reason: `${name} does not match its checksum` });
	}
	return {
		entry: { name, data },
		nextCentralOffset:
			nameStart +
			nameLength +
			archive.readUInt16LE(centralOffset + ZipReadLayout.centralExtraLength) +
			archive.readUInt16LE(centralOffset + ZipReadLayout.centralCommentLength),
	};
}
