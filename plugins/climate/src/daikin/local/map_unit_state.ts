import { UnitProtocolError } from '../errors/unit_protocol_error';
import { parseNullableNumber } from '../protocol/parse_nullable_number';
import { requireValue } from '../protocol/require_value';
import type { RawRecord } from '../raw_record';
import type { UnitState } from '../unit_types';
import { lookupCode } from './lookup_code';
import { mapSpecialModes } from './map_special_modes';
import { RAW_CODES } from './raw_codes';

const MODULATED_TEMPERATURE = 'M';

function mapPower(raw: string): boolean {
	if (raw === '1') return true;
	if (raw === '0') return false;
	throw new UnitProtocolError(`Unknown value "${raw}" for "pow"`);
}

function mapTargetTemperature(raw: string): number | null {
	if (raw === MODULATED_TEMPERATURE) return null;
	return parseNullableNumber('stemp', raw);
}

/** Maps raw `get_control_info` to the domain state. */
export function mapUnitState(control: RawRecord): UnitState {
	return {
		isPowered: mapPower(requireValue(control, 'pow')),
		mode: lookupCode(
			RAW_CODES.modeByRaw,
			'mode',
			requireValue(control, 'mode')
		),
		targetTemperature: mapTargetTemperature(requireValue(control, 'stemp')),
		fanRate: lookupCode(
			RAW_CODES.fanRateByRaw,
			'f_rate',
			requireValue(control, 'f_rate')
		),
		fanDirection: lookupCode(
			RAW_CODES.fanDirectionByRaw,
			'f_dir',
			requireValue(control, 'f_dir')
		),
		specialModes: mapSpecialModes(control),
	};
}
