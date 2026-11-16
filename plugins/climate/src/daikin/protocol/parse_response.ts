import { UnitProtocolError } from '../errors/unit_protocol_error';
import type { RawRecord } from '../raw_record';

function decodeValue(key: string, encoded: string): string {
	try {
		return decodeURIComponent(encoded);
	} catch (cause) {
		throw new UnitProtocolError(`Invalid URL-encoding in value of "${key}"`, {
			cause,
		});
	}
}

function parseEntry(segment: string): readonly [string, string] {
	const separatorIndex = segment.indexOf('=');
	if (separatorIndex <= 0) {
		throw new UnitProtocolError(`Malformed entry "${segment}"`);
	}
	const key = segment.slice(0, separatorIndex);
	return [key, decodeValue(key, segment.slice(separatorIndex + 1))];
}

/** Parses `ret=OK,k=v,...` into a record of URL-decoded values. `-` and `--` are kept as is. */
export function parseResponse(body: string): RawRecord {
	const segments = body
		.trim()
		.split(',')
		.filter((segment) => segment.length > 0);
	const record: RawRecord = Object.fromEntries(segments.map(parseEntry));
	if (record['ret'] === undefined) {
		throw new UnitProtocolError('Response has no "ret" key');
	}
	return record;
}
