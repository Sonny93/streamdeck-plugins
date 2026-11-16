import { keyLabelSettingsSchema } from 'deck-kit/keys/key_label_settings_schema';
import { z } from 'zod';

import type { FanRate } from '../../daikin/unit_types';

const FAN_RATE_TEXTS = ['auto', 'silent', '1', '2', '3', '4', '5'] as const;

const FAN_RATES: Readonly<Record<(typeof FAN_RATE_TEXTS)[number], FanRate>> = {
	auto: 'auto',
	silent: 'silent',
	'1': 1,
	'2': 2,
	'3': 3,
	'4': 4,
	'5': 5,
};

/** A property inspector writes an empty field as an empty text, which means the setting is not set; a number is read as its text, and a French decimal comma as a point. */
function normalizeSetting(value: unknown): unknown {
	if (typeof value === 'number') {
		return String(value);
	}
	if (typeof value !== 'string') {
		return value;
	}
	const trimmed = value.trim();
	return trimmed === '' ? undefined : trimmed.replace(',', '.');
}

/**
 * Settings of a "Preset" key, written by its property inspector. Unlike the other actions, a wrong value is not replaced
 * by a default: the whole settings are refused, so the key shows it cannot work instead of doing something else.
 */
export const presetSettingsSchema = keyLabelSettingsSchema.extend({
	mode: z.preprocess(
		normalizeSetting,
		z.enum(['cool', 'heat', 'auto', 'dry', 'fan']).optional()
	),
	temperature: z.preprocess(
		normalizeSetting,
		z.coerce.number().multipleOf(0.5).optional()
	),
	fanRate: z.preprocess(
		normalizeSetting,
		z
			.enum(FAN_RATE_TEXTS)
			.transform((text) => FAN_RATES[text])
			.optional()
	),
});
