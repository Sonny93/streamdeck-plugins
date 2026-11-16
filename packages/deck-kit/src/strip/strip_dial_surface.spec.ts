import { describe, expect, it, vi } from 'vitest';

import { StripDialSurface } from './strip_dial_surface';

function createSurface(
	overrides: Readonly<{
		encode?: (svg: string) => Promise<string | undefined>;
	}> = {}
) {
	let hiddenListener: () => void = () => undefined;
	const idle = {
		isShowing: false,
		attach: vi.fn(),
		detach: vi.fn(),
		wake: vi.fn(() => false),
		onHidden: (listener: () => void) => {
			hiddenListener = listener;
			return () => undefined;
		},
	};
	const redraw = vi.fn();
	const surface = new StripDialSurface({ idle, redraw, ...overrides });
	const setFeedback = vi.fn((_feedback: Readonly<Record<string, string>>) =>
		Promise.resolve()
	);
	const dial = { id: 'dial', coordinates: { column: 2 }, setFeedback };
	return {
		surface,
		idle,
		redraw,
		setFeedback,
		dial,
		hide: () => hiddenListener(),
	};
}

describe('StripDialSurface', () => {
	it('should attach a dial to the idle panel with its column when it appears', () => {
		const { surface, idle, dial } = createSurface();

		surface.appear(dial);

		expect(idle.attach).toHaveBeenCalledWith(
			expect.objectContaining({ id: 'dial', column: 2 })
		);
	});

	it('should send the feedback of the dial through the attached handle', async () => {
		const { surface, idle, dial, setFeedback } = createSurface();
		surface.appear(dial);
		const [attached] = idle.attach.mock.calls[0] as [
			{ setFeedback: (feedback: Record<string, string>) => Promise<void> },
		];

		await attached.setFeedback({ canvas: 'image' });

		expect(setFeedback).toHaveBeenCalledWith({ canvas: 'image' });
	});

	it('should use the first column when the dial has no coordinates', () => {
		const { surface } = createSurface();

		expect(surface.columnOf({ coordinates: undefined })).toBe(0);
	});

	it('should detach a dial from the idle panel when it disappears', () => {
		const { surface, idle } = createSurface();

		surface.disappear('dial');

		expect(idle.detach).toHaveBeenCalledWith('dial');
	});

	it('should draw the picture of the column of the dial as a data URL', async () => {
		const { surface, dial, setFeedback } = createSurface();

		await surface.draw(dial, (column) => `<svg>${column}</svg>`);

		const [feedback] = setFeedback.mock.calls[0] ?? [];
		expect(feedback?.['canvas']).toBe(
			`data:image/svg+xml;base64,${Buffer.from('<svg>2</svg>').toString('base64')}`
		);
	});

	it('should send a picture only when it differs from the last one', async () => {
		const { surface, dial, setFeedback } = createSurface();

		await surface.draw(dial, () => 'same');
		await surface.draw(dial, () => 'same');
		await surface.draw(dial, () => 'other');

		expect(setFeedback).toHaveBeenCalledTimes(2);
	});

	it('should draw nothing while the idle panel shows', async () => {
		const { surface, idle, dial, setFeedback } = createSurface();
		idle.isShowing = true;

		await surface.draw(dial, () => 'picture');

		expect(setFeedback).not.toHaveBeenCalled();
	});

	it('should draw again the same picture after the idle panel went away, and ask the owner to redraw', async () => {
		const { surface, dial, setFeedback, redraw, hide } = createSurface();
		await surface.draw(dial, () => 'picture');

		hide();
		await surface.draw(dial, () => 'picture');

		expect(redraw).toHaveBeenCalledTimes(1);
		expect(setFeedback).toHaveBeenCalledTimes(2);
	});

	it('should send what the encoder returns under the feedback key, and nothing when it gives no image', async () => {
		const { surface, dial, setFeedback } = createSurface({
			encode: (svg) =>
				Promise.resolve(svg === 'skip' ? undefined : `png:${svg}`),
		});

		await surface.draw(dial, () => 'skip');
		await surface.draw(dial, () => 'keep');

		expect(setFeedback).toHaveBeenCalledTimes(1);
		expect(setFeedback).toHaveBeenCalledWith({ canvas: 'png:keep' });
	});

	it('should forget the last picture of a dial that disappeared', async () => {
		const { surface, dial, setFeedback } = createSurface();
		await surface.draw(dial, () => 'picture');

		surface.disappear('dial');
		await surface.draw(dial, () => 'picture');

		expect(setFeedback).toHaveBeenCalledTimes(2);
	});

	it('should pass the gesture to the idle panel and return whether to swallow the event', () => {
		const { surface, idle } = createSurface();
		idle.wake.mockReturnValue(true);

		expect(surface.consumeWake('press')).toBe(true);
		expect(idle.wake).toHaveBeenCalledWith('press');
	});
});
