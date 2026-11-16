import { UnitProtocolError } from '../errors/unit_protocol_error';

export function lookupCode<TDomain>(
	table: ReadonlyMap<string, TDomain>,
	key: string,
	raw: string
): TDomain {
	const value = table.get(raw);
	if (value === undefined) {
		throw new UnitProtocolError(`Unknown value "${raw}" for "${key}"`);
	}
	return value;
}
