import { StripDialSurface } from 'deck-kit/strip/strip_dial_surface';
import { describe, expect, it, vi } from 'vitest';

import type { AudioTarget } from '../../audio/audio_target';
import { buildAudioSnapshotForTest } from './build_audio_snapshot_for_test';
import { buildVolumeDialSvg } from './build_volume_dial_svg';

const DEFAULT_OUTPUT: AudioTarget = { kind: 'default', flow: 'output' };

function createDial(id: string, column: number) {
	const setFeedback = vi.fn((_feedback: Readonly<Record<string, string>>) =>
		Promise.resolve()
	);
	return { id, coordinates: { column }, setFeedback };
}

function createSurface(isShowing = false) {
	const idle = {
		isShowing,
		attach: vi.fn(),
		detach: vi.fn(),
		wake: vi.fn(() => false),
		onHidden: () => () => undefined,
	};
	return { surface: new StripDialSurface({ idle, redraw: vi.fn() }), idle };
}

function buildSnapshot(name: string, level: number) {
	return buildAudioSnapshotForTest([
		{
			device: { id: 'speakers', name, flow: 'output' },
			volume: { level, isMuted: false },
		},
	]);
}

describe('the volume dial on the strip surface', () => {
	it('should send again only the strips that changed when one volume changes', async () => {
		const { surface } = createSurface();
		const dials = [createDial('a', 0), createDial('b', 1)];
		const draw = async (firstLevel: number) => {
			const first = await buildSnapshot('First', firstLevel);
			const second = await buildSnapshot('Second', 0.5);
			await Promise.all([
				surface.draw(dials[0]!, (column) =>
					buildVolumeDialSvg({
						snapshot: first,
						target: DEFAULT_OUTPUT,
						language: 'en',
						column,
					})
				),
				surface.draw(dials[1]!, (column) =>
					buildVolumeDialSvg({
						snapshot: second,
						target: DEFAULT_OUTPUT,
						language: 'en',
						column,
					})
				),
			]);
		};
		await draw(0.4);

		await draw(0.45);

		expect(dials[0]?.setFeedback).toHaveBeenCalledTimes(2);
		expect(dials[1]?.setFeedback).toHaveBeenCalledTimes(1);
	});

	it('should draw the column of each dial', async () => {
		const { surface } = createSurface();
		const dial = createDial('a', 2);
		const snapshot = await buildSnapshot('Speakers', 0.5);

		await surface.draw(dial, (column) =>
			buildVolumeDialSvg({
				snapshot,
				target: DEFAULT_OUTPUT,
				language: 'en',
				column,
			})
		);

		const [feedback] = dial.setFeedback.mock.calls[0] ?? [];
		const svg = Buffer.from(
			(feedback?.['canvas'] ?? '').split(',')[1] ?? '',
			'base64'
		).toString('utf8');
		expect(svg).toContain('translate(-400 0)');
	});

	it('should draw nothing of its own while the idle panel shows', async () => {
		const { surface } = createSurface(true);
		const dial = createDial('a', 0);

		await surface.draw(dial, () => '<svg/>');

		expect(dial.setFeedback).not.toHaveBeenCalled();
	});

	it.each(['press', 'release', 'other'] as const)(
		'should hand the %s gesture to the idle panel before anything else',
		(gesture) => {
			const { surface, idle } = createSurface();

			surface.consumeWake(gesture);

			expect(idle.wake).toHaveBeenCalledWith(gesture);
		}
	);
});
