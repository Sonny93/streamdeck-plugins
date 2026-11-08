import { removePersonalSettings } from './remove_personal_settings.ts';

const BYTE_ORDER_MARK = /^\uFEFF/u;
const JSON_EXTENSION = '.json';

/** Strips the personal settings from a JSON file and pretty-prints it with tabs and a final newline, so the diff of a re-exported profile stays readable. Other files are returned as they are. */
export function formatProfileFile(
	options: Readonly<{ name: string; data: Uint8Array }>
): Uint8Array {
	if (!options.name.endsWith(JSON_EXTENSION)) {
		return options.data;
	}
	const text = Buffer.from(options.data)
		.toString('utf8')
		.replace(BYTE_ORDER_MARK, '');
	const parsed: unknown = JSON.parse(text);
	const scrubbed = removePersonalSettings({ manifest: parsed });
	return Buffer.from(`${JSON.stringify(scrubbed, null, '\t')}\n`, 'utf8');
}
