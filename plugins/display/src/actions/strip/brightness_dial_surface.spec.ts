import { StripDialSurface } from 'deck-kit/strip/strip_dial_surface';
import { describe, expect, it, vi } from 'vitest';

import { buildMonitorSnapshotForTest } from '../../displays/build_monitor_snapshot_for_test';
import { readDisplayActionConfig } from '../display/read_display_action_config';
import { buildBrightnessDialSvg } from './build_brightness_dial_svg';

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

describe('the brightness dial on the strip surface', () => {
	const first = readDisplayActionConfig(
		{ monitor: 'first' },
		{ offersAll: true }
	);
	const second = readDisplayActionConfig(
		{ monitor: 'second' },
		{ offersAll: true }
	);

	it('should send again only the strips that changed when one monitor changes', async () => {
		const { surface } = createSurface();
		const dials = [createDial('a', 0), createDial('b', 1)];
		const draw = (firstBrightness: number) =>
			Promise.all([
				surface.draw(dials[0]!, (column) =>
					buildBrightnessDialSvg(
						[
							buildMonitorSnapshotForTest({
								name: 'First',
								monitorBrightness: firstBrightness,
							}),
						],
						first,
						'en',
						column
					)
				),
				surface.draw(dials[1]!, (column) =>
					buildBrightnessDialSvg(
						[buildMonitorSnapshotForTest({ name: 'Second' })],
						second,
						'en',
						column
					)
				),
			]);
		await draw(40);

		await draw(45);

		expect(dials[0]?.setFeedback).toHaveBeenCalledTimes(2);
		expect(dials[1]?.setFeedback).toHaveBeenCalledTimes(1);
	});

	it('should draw the column of each dial', async () => {
		const { surface } = createSurface();
		const dial = createDial('a', 2);

		await surface.draw(dial, (column) =>
			buildBrightnessDialSvg(
				[buildMonitorSnapshotForTest()],
				first,
				'en',
				column
			)
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
