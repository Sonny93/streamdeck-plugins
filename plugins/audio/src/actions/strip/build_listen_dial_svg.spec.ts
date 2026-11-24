import { measureStripTexts } from 'deck-kit/strip/measure_strip_texts';
import { StripPanel } from 'deck-kit/strip/strip_panel';
import { describe, expect, it } from 'vitest';

import {
	buildListenSource,
	REAR_MIC_ID,
} from '../../listen/build_listen_source';
import type { ListenView } from '../../listen/listen_view';
import { buildListenDialSvg } from './build_listen_dial_svg';
import { StripPalette } from './strip_palette';
import { StripTones } from './strip_tones';

const SLOT_MARGIN = 12;
const MAXIMUM_LEVEL = 0.2;

function buildView(isListening: boolean, name = 'Rear Mic'): ListenView {
	return {
		sources: [buildListenSource({ name })],
		listenedSourceIds: new Set(isListening ? [REAR_MIC_ID] : []),
	};
}

function draw(
	view: ListenView | undefined,
	overrides: Partial<Parameters<typeof buildListenDialSvg>[0]> = {}
): string {
	return buildListenDialSvg({
		view,
		sourceId: REAR_MIC_ID,
		level: 0.1,
		maximumLevel: MAXIMUM_LEVEL,
		language: 'en',
		...overrides,
	});
}

describe('buildListenDialSvg', () => {
	it.each([
		['en', 'Listening'],
		['fr', 'Écoute'],
	] as const)(
		'should write the listening state in %s and use the amber look',
		(language, word) => {
			const svg = draw(buildView(true), { language });

			expect(svg).toContain('>Rear Mic<');
			expect(svg).toContain(`>${word}<`);
			expect(svg).toContain(`fill="${StripPalette.accent}" fill-opacity="1"`);
			expect(svg).toContain(StripTones.amber.from);
		}
	);

	it.each([
		['en', 'Off'],
		['fr', 'Coupé'],
	] as const)(
		'should write the off state in %s over the neutral background',
		(language, word) => {
			const svg = draw(buildView(false), { language });

			expect(svg).toContain(`>${word}<`);
			expect(svg).toContain(StripTones.neutral.from);
			expect(svg).toContain('fill-opacity="0.5"');
		}
	);

	it('should show the level without decimal when it is whole', () => {
		expect(draw(buildView(true), { level: 0.1 })).toContain('>10 %<');
	});

	it.each([
		['en', '12.5 %'],
		['fr', '12,5 %'],
	] as const)(
		'should show one decimal in %s when the level needs it',
		(language, text) => {
			expect(draw(buildView(true), { level: 0.125, language })).toContain(
				`>${text}<`
			);
		}
	);

	it('should fill the bar against the ceiling', () => {
		expect(draw(buildView(true), { level: 0.1 })).toContain('width="88"');
		expect(draw(buildView(true), { level: 0.5 })).toContain('width="176"');
	});

	it.each([
		['there is no hub', undefined, REAR_MIC_ID, 'Unavailable'],
		['the input is unplugged', buildView(false), 'other', 'Unavailable'],
		['no input is picked', buildView(false), undefined, 'No input'],
	] as const)(
		'should dim the picture and say why when %s',
		(_case, view, sourceId, message) => {
			const svg = draw(view, { sourceId });

			expect(svg).toContain(`>${message}<`);
			expect(svg).toContain('<g opacity="0.7">');
			expect(svg).not.toContain(' %<');
		}
	);
});

describe.each(['en', 'fr'] as const)(
	'the texts of the listen strip in %s',
	(language) => {
		it('should fit the strip for a long name, a whole level and the longest state', () => {
			const svg = draw(
				buildView(true, 'A very long input name of a sound card'),
				{
					language,
					level: 1,
					maximumLevel: 1,
				}
			);

			const texts = measureStripTexts(svg);
			expect(texts.length).toBeGreaterThan(2);
			for (const text of texts) {
				expect(text.left, text.text).toBeGreaterThanOrEqual(SLOT_MARGIN);
				expect(text.right, text.text).toBeLessThanOrEqual(StripPanel.slotWidth);
			}
		});
	}
);
