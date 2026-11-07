import { ZipFormat } from 'deck-kit/zip/zip_format';

import { ZipReadError } from './zip_read_error.ts';
import { ZipReadLayout } from './zip_read_layout.ts';

/** Returns the offset of the end of central directory record, searching backwards past a possible archive comment. */
export function findEndRecord(options: Readonly<{ archive: Buffer }>): number {
	const { archive } = options;
	const lastCandidate = archive.length - ZipReadLayout.endRecordSize;
	const firstCandidate = Math.max(
		0,
		lastCandidate - ZipReadLayout.maxCommentLength
	);
	for (let offset = lastCandidate; offset >= firstCandidate; offset -= 1) {
		if (archive.readUInt32LE(offset) === ZipFormat.endRecordSignature) {
			return offset;
		}
	}
	throw new ZipReadError({
		reason: 'Not a zip archive: no end of central directory record',
	});
}
