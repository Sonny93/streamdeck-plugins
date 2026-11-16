import type { RawRecord } from '../raw_record';
import type { SpecialMode } from '../unit_types';
import { RAW_CODES } from './raw_codes';

const CODE_SEPARATOR = '/';

/** Maps the `adv` field of `get_control_info`: empty when none is active, codes separated by `/`. Unknown codes are ignored. */
export function mapSpecialModes(control: RawRecord): readonly SpecialMode[] {
	const codes = (control['adv'] ?? '').split(CODE_SEPARATOR);
	return codes.flatMap((code) => {
		const mode = RAW_CODES.specialModeByRaw.get(code);
		return mode === undefined ? [] : [mode];
	});
}
