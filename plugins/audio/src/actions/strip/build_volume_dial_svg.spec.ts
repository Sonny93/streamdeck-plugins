import { measureStripTexts } from 'deck-kit/strip/measure_strip_texts';
import { StripPanel } from 'deck-kit/strip/strip_panel';
import { describe, expect, it } from 'vitest';

import type { AudioTarget } from '../../audio/audio_target';
import { buildAudioSnapshotForTest } from './build_audio_snapshot_for_test';
import { buildVolumeDialSvg } from './build_volume_dial_svg';
import { readFixtureAudioEntriesForTest } from './read_fixture_audio_entries_for_test';
import { StripPalette } from './strip_palette';
import { StripTones } from './strip_tones';

const DEFAULT_OUTPUT: AudioTarget = { kind: 'default', flow: 'output' };
const DEFAULT_INPUT: AudioTarget = { kind: 'default', flow: 'input' };
const LANGUAGES = ['en', 'fr'] as const;
const FIXTURE_ENTRIES = readFixtureAudioEntriesForTest();
const FIXTURE_NAMES = FIXTURE_ENTRIES.map((entry) => entry.device.name);
const LONGEST_FIXTURE_NAME =
	FIXTURE_NAMES.toSorted((first, second) => second.length - first.length)[0] ??
	'';
const SLOT_MARGIN = 12;

function buildEntry(name: string, level: number, isMuted = false) {
	return {
		device: { id: 'speakers', name, flow: 'output' as const },
		volume: { level, isMuted },
	};
}

describe('buildVolumeDialSvg', () => {
	it('should show the device name, its volume and a bar when the device is live', async () => {
		const snapshot = await buildAudioSnapshotForTest([
			buildEntry('Speakers', 0.7),
		]);

		const svg = buildVolumeDialSvg({
			snapshot,
			target: DEFAULT_OUTPUT,
			language: 'en',
		});

		expect(svg).toContain('>Speakers<');
		expect(svg).toContain('>70 %<');
		expect(svg).toContain(`fill="${StripPalette.accent}" fill-opacity="1"`);
		expect(svg).toContain(StripTones.amber.from);
		expect(svg).toContain('<g opacity="1">');
	});

	it.each([
		['en', 'Muted'],
		['fr', 'Muet'],
	] as const)(
		'should write the muted state in %s as %s and dim the picture over the neutral background',
		async (language, word) => {
			const snapshot = await buildAudioSnapshotForTest([
				buildEntry('Speakers', 0.5, true),
			]);

			const svg = buildVolumeDialSvg({
				snapshot,
				target: DEFAULT_OUTPUT,
				language,
			});

			expect(svg).toContain(`>${word}<`);
			expect(svg).toContain('<g opacity="0.7">');
			expect(svg).toContain(StripTones.neutral.from);
			expect(svg).toContain('fill-opacity="0.4"');
		}
	);

	it.each([
		['en', 'No device', 'Input'],
		['fr', 'Introuvable', 'Entrée'],
	] as const)(
		'should say there is no device in %s when the default input is missing',
		async (language, message, title) => {
			const snapshot = await buildAudioSnapshotForTest([
				buildEntry('Speakers', 0.5),
			]);

			const svg = buildVolumeDialSvg({
				snapshot,
				target: DEFAULT_INPUT,
				language,
			});

			expect(svg).toContain(`>${message}<`);
			expect(svg).toContain(`>${title}<`);
			expect(svg).toContain(StripTones.neutral.from);
		}
	);

	it.each([
		['en', 'Unavailable'],
		['fr', 'Indisponible'],
	] as const)(
		'should say %s is "%s" when there is no snapshot',
		(language, message) => {
			const svg = buildVolumeDialSvg({
				snapshot: undefined,
				target: DEFAULT_OUTPUT,
				language,
			});

			expect(svg).toContain(`>${message}<`);
			expect(svg).not.toContain(' %<');
		}
	);

	it('should draw the slice of the column it is given of the continuous background', () => {
		const svg = buildVolumeDialSvg({
			snapshot: undefined,
			target: DEFAULT_OUTPUT,
			language: 'en',
			column: 3,
		});

		expect(svg).toContain('translate(-600 0)');
		expect(svg).toContain('width="200" height="100"');
	});
});

describe.each(LANGUAGES)('the texts of the volume strip in %s', (language) => {
	function expectFits(svg: string): void {
		const texts = measureStripTexts(svg);
		expect(texts.length).toBeGreaterThan(1);
		for (const text of texts) {
			expect(text.left, text.text).toBeGreaterThanOrEqual(SLOT_MARGIN);
			expect(text.right, text.text).toBeLessThanOrEqual(StripPanel.slotWidth);
		}
	}

	it('should fit the strip for the longest name of the fixtures', async () => {
		const snapshot = await buildAudioSnapshotForTest([
			buildEntry(LONGEST_FIXTURE_NAME, 1),
		]);

		const svg = buildVolumeDialSvg({
			snapshot,
			target: DEFAULT_OUTPUT,
			language,
		});

		expectFits(svg);
		expect(svg).toContain('…');
	});

	it.each(FIXTURE_NAMES)(
		'should fit the strip for the device name "%s", live or muted',
		async (name) => {
			for (const isMuted of [false, true]) {
				const snapshot = await buildAudioSnapshotForTest([
					buildEntry(name, 0.35, isMuted),
				]);

				expectFits(
					buildVolumeDialSvg({ snapshot, target: DEFAULT_OUTPUT, language })
				);
			}
		}
	);

	it('should fit the strip when there is no device or no snapshot', async () => {
		const snapshot = await buildAudioSnapshotForTest([]);

		expectFits(
			buildVolumeDialSvg({ snapshot, target: DEFAULT_OUTPUT, language })
		);
		expectFits(
			buildVolumeDialSvg({
				snapshot: undefined,
				target: DEFAULT_INPUT,
				language,
			})
		);
	});
});
