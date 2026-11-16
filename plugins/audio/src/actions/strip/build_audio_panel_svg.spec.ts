import { measureStripTexts } from 'deck-kit/strip/measure_strip_texts';
import { StripPanel } from 'deck-kit/strip/strip_panel';
import { describe, expect, it } from 'vitest';

import type { AudioDevice } from '../../audio/audio_device';
import type { AudioFlow } from '../../audio/audio_flow';
import { buildVoltState } from '../../volt/build_volt_state';
import type { VoltStatus } from '../../volt/volt_status';
import { buildAudioPanelSvg } from './build_audio_panel_svg';
import { buildAudioSnapshotForTest } from './build_audio_snapshot_for_test';
import { readFixtureAudioEntriesForTest } from './read_fixture_audio_entries_for_test';
import { StripTones } from './strip_tones';

const LANGUAGES = ['en', 'fr'] as const;
const OUTPUT_COLUMN = 0;
const INPUT_COLUMN = 1;
const VOLT_COLUMN = 2;
const PLAIN_COLUMN = 3;
const SLOT_MARGIN = 12;
const LONGEST_FIXTURE_NAME =
	readFixtureAudioEntriesForTest()
		.map((entry) => entry.device.name)
		.toSorted((first, second) => second.length - first.length)[0] ?? '';
const READY: VoltStatus = {
	kind: 'ready',
	state: buildVoltState({ monitor: true }),
};

function buildEntry(
	flow: AudioFlow,
	name: string,
	level: number,
	isMuted = false
) {
	const device: AudioDevice = { id: `${flow}-device`, name, flow };
	return { device, volume: { level, isMuted } };
}

function buildSnapshot(options: { isInputMuted?: boolean } = {}) {
	return buildAudioSnapshotForTest([
		buildEntry('output', 'Speakers', 0.7),
		buildEntry('input', 'Microphone', 0.4, options.isInputMuted),
	]);
}

describe('buildAudioPanelSvg', () => {
	it('should draw the default output in the first column and the default input in the second', async () => {
		const snapshot = await buildSnapshot();

		const output = buildAudioPanelSvg({
			snapshot,
			voltStatus: READY,
			language: 'en',
			column: OUTPUT_COLUMN,
		});
		const input = buildAudioPanelSvg({
			snapshot,
			voltStatus: READY,
			language: 'en',
			column: INPUT_COLUMN,
		});

		expect(output).toContain('>Speakers<');
		expect(output).toContain('>70 %<');
		expect(input).toContain('>Microphone<');
		expect(input).toContain('>40 %<');
	});

	it.each([
		['en', 'Muted'],
		['fr', 'Muet'],
	] as const)(
		'should write "%s" as %s and dim the slot of a muted device',
		async (language, word) => {
			const snapshot = await buildSnapshot({ isInputMuted: true });

			const svg = buildAudioPanelSvg({
				snapshot,
				voltStatus: READY,
				language,
				column: INPUT_COLUMN,
			});

			expect(svg).toContain(`>${word}<`);
			expect(svg).toContain('<g opacity="0.7">');
		}
	);

	it('should keep the amber background while one of the devices is live', async () => {
		const snapshot = await buildSnapshot({ isInputMuted: true });

		const svg = buildAudioPanelSvg({
			snapshot,
			voltStatus: READY,
			language: 'en',
			column: VOLT_COLUMN,
		});

		expect(svg).toContain(StripTones.amber.from);
	});

	it('should draw the plain background in the fourth column', async () => {
		const svg = buildAudioPanelSvg({
			snapshot: await buildSnapshot(),
			voltStatus: READY,
			language: 'en',
			column: PLAIN_COLUMN,
		});

		expect(svg).not.toContain('<text');
		expect(svg).toContain('translate(-600 0)');
	});

	it.each([
		['en', 'Unavailable'],
		['fr', 'Indisponible'],
	] as const)(
		'should say "%s" as %s in the device columns when there is no snapshot, over the neutral background',
		(language, message) => {
			for (const column of [OUTPUT_COLUMN, INPUT_COLUMN]) {
				const svg = buildAudioPanelSvg({
					snapshot: undefined,
					voltStatus: READY,
					language,
					column,
				});

				expect(svg).toContain(`>${message}<`);
				expect(svg).toContain(StripTones.neutral.from);
				expect(svg).not.toContain(' %<');
			}
		}
	);

	it('should leave the Volt 1 column and the plain column to their own content when there is no snapshot', () => {
		const volt = buildAudioPanelSvg({
			snapshot: undefined,
			voltStatus: READY,
			language: 'en',
			column: VOLT_COLUMN,
		});
		const plain = buildAudioPanelSvg({
			snapshot: undefined,
			voltStatus: READY,
			language: 'en',
			column: PLAIN_COLUMN,
		});

		expect(volt).toContain('>Volt 1<');
		expect(volt).not.toContain('>Unavailable<');
		expect(plain).not.toContain('<text');
	});
});

describe('the Volt 1 slot of the idle panel', () => {
	it.each([
		['en', 'On', 'Off'],
		['fr', 'Activé', 'Désactivé'],
	] as const)(
		'should show Monitor, Vintage and 48V with their state in %s, without changing anything',
		(language, on, off) => {
			const svg = buildAudioPanelSvg({
				snapshot: undefined,
				voltStatus: {
					kind: 'ready',
					state: buildVoltState({ monitor: true, phantomPower: true }),
				},
				language,
				column: VOLT_COLUMN,
			});

			const texts = measureStripTexts(svg).map((text) => text.text);
			expect(texts).toEqual([
				'Volt 1',
				'Monitor',
				on,
				'Vintage',
				off,
				'48V',
				on,
			]);
		}
	);

	it.each([
		['en', 'Not connected', 'No report yet'],
		['fr', 'Non connectée', 'Pas encore de rapport'],
	] as const)(
		'should tell "not connected" from "no report yet" in %s',
		(language, notConnected, noReport) => {
			const draw = (voltStatus: VoltStatus) =>
				buildAudioPanelSvg({
					snapshot: undefined,
					voltStatus,
					language,
					column: VOLT_COLUMN,
				});

			const disconnected = draw({ kind: 'disconnected' });
			const waiting = draw({ kind: 'waitingForState' });

			expect(disconnected).toContain(`>${notConnected}<`);
			expect(disconnected).not.toContain(`>${noReport}<`);
			expect(waiting).toContain(`>${noReport}<`);
			expect(waiting).not.toContain(`>${notConnected}<`);
		}
	);
});

describe.each(LANGUAGES)('the texts of the idle panel in %s', (language) => {
	function expectFits(svg: string): void {
		for (const text of measureStripTexts(svg)) {
			expect(text.left, text.text).toBeGreaterThanOrEqual(SLOT_MARGIN);
			expect(text.right, text.text).toBeLessThanOrEqual(StripPanel.slotWidth);
		}
	}

	it('should fit every slot with the longest device name of the fixtures', async () => {
		const snapshot = await buildAudioSnapshotForTest([
			buildEntry('output', LONGEST_FIXTURE_NAME, 1),
			buildEntry('input', LONGEST_FIXTURE_NAME, 1, true),
		]);

		for (const column of [OUTPUT_COLUMN, INPUT_COLUMN]) {
			expectFits(
				buildAudioPanelSvg({
					snapshot,
					voltStatus: READY,
					language,
					column,
				})
			);
		}
	});

	it.each<VoltStatus>([
		READY,
		{ kind: 'disconnected' },
		{ kind: 'waitingForState' },
	])('should fit the Volt 1 slot in the status %j', (voltStatus) => {
		const svg = buildAudioPanelSvg({
			snapshot: undefined,
			voltStatus,
			language,
			column: VOLT_COLUMN,
		});

		expectFits(svg);
		expect(svg).not.toContain('…');
	});
});
