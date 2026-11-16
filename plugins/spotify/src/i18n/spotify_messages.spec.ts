import { estimateTextWidth } from 'deck-kit/text/estimate_text_width';
import { describe, expect, it } from 'vitest';

import { spotifyMessages } from './spotify_messages';

const LANGUAGES = ['en', 'fr'] as const;
const NOTE_FONT_SIZE = 10;
const NOTE_MAX_WIDTH = 176;
const DEVICE_LABEL_FONT_SIZE = 18;
const DEVICE_LABEL_MAX_WIDTH = 128;
const APP_NAME_MAX_LENGTH = 13;
const PLACEHOLDER = /\{(\w+)\}/gu;

function listPlaceholders(text: string): readonly string[] {
	return [...text.matchAll(PLACEHOLDER)]
		.map((match) => match[1] ?? '')
		.toSorted();
}

describe('the messages of the plugin', () => {
	it.each(spotifyMessages.keys())(
		'should have a text in every language for %s',
		(key) => {
			for (const language of LANGUAGES) {
				expect(
					spotifyMessages.raw(key, language).trim(),
					`${key} in ${language}`
				).not.toBe('');
			}
		}
	);

	it.each(spotifyMessages.keys())(
		'should use the same placeholders in every language for %s',
		(key) => {
			expect(listPlaceholders(spotifyMessages.raw(key, 'en'))).toEqual(
				listPlaceholders(spotifyMessages.raw(key, 'fr'))
			);
		}
	);

	it.each(['notPlayingSound', 'pressToUnmute'] as const)(
		'should fit the volume dial note %s in every language',
		(key) => {
			for (const language of LANGUAGES) {
				expect(
					estimateTextWidth({
						text: spotifyMessages.raw(key, language),
						fontSize: NOTE_FONT_SIZE,
						isBold: false,
					})
				).toBeLessThanOrEqual(NOTE_MAX_WIDTH);
			}
		}
	);

	it.each(['noApp', 'pickApp'] as const)(
		'should fit the app name %s in the volume dial in every language',
		(key) => {
			for (const language of LANGUAGES) {
				expect(
					Array.from(spotifyMessages.raw(key, language)).length
				).toBeLessThanOrEqual(APP_NAME_MAX_LENGTH);
			}
		}
	);

	it.each(['noDevice', 'unnamedDevice'] as const)(
		'should fit the device key label %s without an ellipsis in every language',
		(key) => {
			for (const language of LANGUAGES) {
				expect(
					estimateTextWidth({
						text: spotifyMessages.raw(key, language),
						fontSize: DEVICE_LABEL_FONT_SIZE,
						isBold: true,
					})
				).toBeLessThanOrEqual(DEVICE_LABEL_MAX_WIDTH);
			}
		}
	);
});
