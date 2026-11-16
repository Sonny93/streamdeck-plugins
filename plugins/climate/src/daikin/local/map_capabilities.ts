import { UnitProtocolError } from '../errors/unit_protocol_error';
import { requireValue } from '../protocol/require_value';
import type { RawRecord } from '../raw_record';
import type { SwingSupport, UnitCapabilities } from '../unit_types';

const SWING_BY_RAW: ReadonlyMap<string, SwingSupport> = new Map<
	string,
	SwingSupport
>([
	['0', 'none'],
	['1', 'vertical'],
	['2', 'horizontal'],
	['3', 'both'],
]);

function mapSwing(model: RawRecord): SwingSupport {
	if (requireValue(model, 'en_fdir') === '0') return 'none';
	const raw = requireValue(model, 's_fdir');
	const swing = SWING_BY_RAW.get(raw);
	if (swing === undefined) {
		throw new UnitProtocolError(`Unknown value "${raw}" for "s_fdir"`);
	}
	return swing;
}

/** Maps raw `get_model_info`. */
export function mapCapabilities(model: RawRecord): UnitCapabilities {
	return {
		isFanRateSettable: requireValue(model, 'en_frate') === '1',
		swing: mapSwing(model),
		hasHumiditySensor: requireValue(model, 'humd') !== '0',
	};
}
