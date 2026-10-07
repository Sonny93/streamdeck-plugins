import vm from 'node:vm';
import { describe, expect, it } from 'vitest';

import { SpotifyLyricsBinding } from './spotify_lyrics_binding';
import { buildLyricsWatchScript } from './build_lyrics_watch_script';

type ButtonState = 'enabled' | 'disabled' | 'aria-disabled' | 'absent';

function buildFakePage(initialState: ButtonState) {
	let buttonState = initialState;
	let observerCount = 0;
	let notifyMutation: () => void = () => undefined;
	let observeOptions: unknown;
	const reportedPayloads: unknown[] = [];

	class FakeMutationObserver {
		constructor(callback: () => void) {
			observerCount += 1;
			notifyMutation = callback;
		}

		observe(_target: unknown, options: unknown): void {
			observeOptions = options;
		}
	}

	const button = {
		get disabled() {
			return buttonState === 'disabled';
		},
		getAttribute: (name: string) =>
			name === 'aria-disabled' && buttonState === 'aria-disabled'
				? 'true'
				: null,
	};
	const window = {
		[SpotifyLyricsBinding.name]: (payload: unknown) =>
			reportedPayloads.push(payload),
	};
	const document = {
		body: {},
		documentElement: {},
		querySelector: () => (buttonState === 'absent' ? null : button),
	};
	const context = vm.createContext({
		window,
		document,
		MutationObserver: FakeMutationObserver,
	});

	return {
		reportedPayloads,
		runScript: (): unknown =>
			vm.runInContext(buildLyricsWatchScript(), context),
		changeButton: (nextState: ButtonState): void => {
			buttonState = nextState;
			notifyMutation();
		},
		readObserverCount: (): number => observerCount,
		readObserveOptions: (): unknown => observeOptions,
	};
}

describe('buildLyricsWatchScript', () => {
	it('should report available when the lyrics button is enabled', () => {
		const page = buildFakePage('enabled');

		page.runScript();

		expect(page.reportedPayloads).toEqual(['available']);
	});

	it.each<ButtonState>(['disabled', 'aria-disabled', 'absent'])(
		'should report unavailable when the lyrics button is %s',
		(buttonState) => {
			const page = buildFakePage(buttonState);

			page.runScript();

			expect(page.reportedPayloads).toEqual(['unavailable']);
		}
	);

	it('should report again when a mutation changes the availability', () => {
		const page = buildFakePage('enabled');
		page.runScript();

		page.changeButton('disabled');

		expect(page.reportedPayloads).toEqual(['available', 'unavailable']);
	});

	it('should not report again when a mutation leaves the availability unchanged', () => {
		const page = buildFakePage('enabled');
		page.runScript();

		page.changeButton('enabled');

		expect(page.reportedPayloads).toEqual(['available']);
	});

	it('should install a single observer when injected twice', () => {
		const page = buildFakePage('enabled');

		page.runScript();
		page.runScript();

		expect(page.readObserverCount()).toBe(1);
	});

	it('should re-send the current value when injected twice', () => {
		const page = buildFakePage('enabled');

		page.runScript();
		page.runScript();

		expect(page.reportedPayloads).toEqual(['available', 'available']);
	});

	it('should observe the subtree and the disabled attributes', () => {
		const page = buildFakePage('enabled');

		page.runScript();

		expect(page.readObserveOptions()).toEqual({
			subtree: true,
			childList: true,
			attributes: true,
			attributeFilter: ['disabled', 'aria-disabled'],
		});
	});
});
