import type { RawRecord } from '../raw_record';

const CODE_SEPARATOR = '/';
const CODE_BY_KIND: Readonly<Record<string, string>> = {
	'1': '2',
	'2': '12',
};
const EXCLUSIVE_CODES: readonly string[] = Object.values(CODE_BY_KIND);

/**
 * assumed: turning powerful or econo on replaces the other one and keeps the other codes of `adv`;
 * turning one off removes only its code. Returns the new `adv`, or null for `PARAM NG`
 * (`set_spmode` not 0 or 1, unknown `spmode_kind`).
 */
export function applySpecialMode(
	currentAdv: string,
	params: RawRecord
): string | null {
	const setMode = params['set_spmode'];
	const code = CODE_BY_KIND[params['spmode_kind'] ?? ''];
	if (code === undefined || (setMode !== '0' && setMode !== '1')) return null;
	const removedCodes = setMode === '1' ? EXCLUSIVE_CODES : [code];
	const kept = currentAdv
		.split(CODE_SEPARATOR)
		.filter((current) => current !== '' && !removedCodes.includes(current));
	const added = setMode === '1' ? [code] : [];
	return [...kept, ...added].join(CODE_SEPARATOR);
}
