import vm from 'node:vm';
import { describe, expect, it } from 'vitest';

import { SpotifyUiBinding } from './spotify_ui_binding';
import { buildUiWatchScript } from './build_ui_watch_script';

type FakeButton = Readonly<{
	disabled?: boolean;
	attributes?: Readonly<Record<string, string>>;
}>;

type FakeUi = {
	lyricsButton: FakeButton | undefined;
	fullscreenButton: FakeButton | undefined;
	hasSearchInput: boolean;
	fullscreenElement: unknown;
	hasFocus: boolean;
};

const DEFAULT_UI: FakeUi = {
	lyricsButton: { attributes: { 'aria-pressed': 'false' } },
	fullscreenButton: { attributes: { 'aria-pressed': 'false' } },
	hasSearchInput: false,
	fullscreenElement: null,
	hasFocus: false,
};

function toElement(button: FakeButton | undefined) {
	if (button === undefined) {
		return null;
	}
	return {
		disabled: button.disabled ?? false,
		getAttribute: (name: string) => button.attributes?.[name] ?? null,
	};
}

function buildFakePage(initial: Partial<FakeUi> = {}) {
	const ui: FakeUi = { ...DEFAULT_UI, ...initial };
	let observerCount = 0;
	let notifyMutation: () => void = () => undefined;
	const listeners = new Map<string, () => void>();
	const reportedPayloads: string[] = [];

	class FakeMutationObserver {
		constructor(callback: () => void) {
			observerCount += 1;
			notifyMutation = callback;
		}

		observe(): void {
			// The fake page triggers mutations by hand.
		}
	}

	const window = {
		[SpotifyUiBinding.name]: (payload: string) =>
			reportedPayloads.push(payload),
		addEventListener: (type: string, listener: () => void) =>
			listeners.set(`window:${type}`, listener),
	};
	const document = {
		body: {},
		documentElement: {},
		get fullscreenElement() {
			return ui.fullscreenElement;
		},
		hasFocus: () => ui.hasFocus,
		addEventListener: (type: string, listener: () => void) =>
			listeners.set(`document:${type}`, listener),
		querySelector: (selector: string) => {
			if (selector.includes('lyrics-button')) {
				return toElement(ui.lyricsButton);
			}
			if (selector.includes('fullscreen-mode-button')) {
				return toElement(ui.fullscreenButton);
			}
			return ui.hasSearchInput ? {} : null;
		},
	};
	const context = vm.createContext({
		window,
		document,
		JSON,
		MutationObserver: FakeMutationObserver,
	});

	return {
		reportedPayloads,
		lastState: (): unknown =>
			JSON.parse(reportedPayloads.at(-1) ?? 'null') as unknown,
		runScript: (): unknown => vm.runInContext(buildUiWatchScript(), context),
		change: (next: Partial<FakeUi>, event?: string): void => {
			Object.assign(ui, next);
			if (event === undefined) {
				notifyMutation();
				return;
			}
			listeners.get(event)?.();
		},
		readObserverCount: (): number => observerCount,
	};
}

describe('buildUiWatchScript', () => {
	it('should report the current state when injected', () => {
		const page = buildFakePage();

		page.runScript();

		expect(page.lastState()).toEqual({
			isLyricsAvailable: true,
			isLyricsOpen: false,
			isFullscreen: false,
			isSearchOpen: false,
			isFocused: false,
		});
	});

	it('should report the lyrics as open when the lyrics button is pressed', () => {
		const page = buildFakePage();
		page.runScript();

		page.change({ lyricsButton: { attributes: { 'aria-pressed': 'true' } } });

		expect(page.lastState()).toMatchObject({ isLyricsOpen: true });
	});

	it('should report the lyrics as unavailable when the button is disabled', () => {
		const page = buildFakePage({
			lyricsButton: { disabled: true, attributes: { 'aria-pressed': 'true' } },
		});

		page.runScript();

		expect(page.lastState()).toMatchObject({
			isLyricsAvailable: false,
			isLyricsOpen: false,
		});
	});

	it('should report the lyrics as unavailable when the button is missing', () => {
		const page = buildFakePage({ lyricsButton: undefined });

		page.runScript();

		expect(page.lastState()).toMatchObject({ isLyricsAvailable: false });
	});

	it('should report the full screen from the full screen change event', () => {
		const page = buildFakePage();
		page.runScript();

		page.change({ fullscreenElement: {} }, 'document:fullscreenchange');

		expect(page.lastState()).toMatchObject({ isFullscreen: true });
	});

	it('should report the search as open when its input exists', () => {
		const page = buildFakePage();
		page.runScript();

		page.change({ hasSearchInput: true });

		expect(page.lastState()).toMatchObject({ isSearchOpen: true });
	});

	it('should report the focus from the focus and blur events', () => {
		const page = buildFakePage();
		page.runScript();

		page.change({ hasFocus: true }, 'window:focus');
		expect(page.lastState()).toMatchObject({ isFocused: true });

		page.change({ hasFocus: false }, 'window:blur');
		expect(page.lastState()).toMatchObject({ isFocused: false });
	});

	it('should not report again when nothing changed', () => {
		const page = buildFakePage();
		page.runScript();

		page.change({});

		expect(page.reportedPayloads).toHaveLength(1);
	});

	it('should observe only once and re-send the state when injected twice', () => {
		const page = buildFakePage();

		page.runScript();
		page.runScript();

		expect(page.readObserverCount()).toBe(1);
		expect(page.reportedPayloads).toHaveLength(2);
	});
});
