import type { RawRecord } from '../raw_record';

/** Splits `k=v,k=v` on the wire form, keeping values URL-encoded (no decoding). */
export function splitWireString(wire: string): RawRecord {
	return Object.fromEntries(
		wire.split(',').map((segment) => {
			const separatorIndex = segment.indexOf('=');
			return [
				segment.slice(0, separatorIndex),
				segment.slice(separatorIndex + 1),
			];
		})
	);
}
