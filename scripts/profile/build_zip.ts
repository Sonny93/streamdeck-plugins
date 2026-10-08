import { crc32 } from 'node:zlib';

import { ZipFormat } from './zip_format.ts';
import type { ZipEntry } from './zip_entry.ts';
import { buildEndRecord } from './build_end_record.ts';
import { buildLocalHeader } from './build_local_header.ts';
import { buildCentralHeader } from './build_central_header.ts';

/** Builds a zip archive that stores the entries uncompressed, in the given order and with a fixed timestamp, so the same entries always give the same bytes. */
export function buildZip(
	options: Readonly<{ entries: readonly ZipEntry[] }>
): Buffer {
	const localParts: Buffer[] = [];
	const centralParts: Buffer[] = [];
	let offset = 0;
	for (const entry of options.entries) {
		const name = Buffer.from(entry.name, 'utf8');
		const crc = crc32(entry.data);
		const size = entry.data.length;
		const localHeader = buildLocalHeader({ name, crc, size });
		centralParts.push(
			buildCentralHeader({
				name,
				crc,
				size,
				offset,
				isDirectory: entry.name.endsWith(ZipFormat.directorySuffix),
			})
		);
		localParts.push(localHeader, Buffer.from(entry.data));
		offset += localHeader.length + size;
	}
	const central = Buffer.concat(centralParts);
	const endRecord = buildEndRecord({
		entryCount: options.entries.length,
		centralSize: central.length,
		centralOffset: offset,
	});
	return Buffer.concat([...localParts, central, endRecord]);
}
