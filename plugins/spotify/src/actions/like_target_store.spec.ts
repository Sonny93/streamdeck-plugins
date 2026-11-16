import { LanguageStore } from 'deck-kit/i18n/language_store';
import type { GlobalSettingsPort } from 'deck-kit/settings/global_settings_port';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { LikeTarget } from './like_target';
import { LikeTargetStore } from './like_target_store';

const settingsMock = vi.hoisted(() => ({
	onDidReceiveGlobalSettings: vi.fn(),
}));

vi.mock('@elgato/streamdeck', () => ({
	streamDeck: { settings: settingsMock },
}));

const TARGET: LikeTarget = {
	uri: 'spotify:playlist:a',
	name: 'Road trip',
	kind: 'playlist',
};

function buildPort(stored: unknown = {}) {
	let current: unknown = stored;
	const write = vi.fn((settings: unknown) => {
		current = settings;
		return Promise.resolve();
	});
	const port: GlobalSettingsPort = {
		read: () => Promise.resolve(current),
		write,
	};
	return { port, write, readStored: () => current };
}

function captureSettingsListener(): (ev: { settings: unknown }) => void {
	const listener = settingsMock.onDidReceiveGlobalSettings.mock.calls[0]?.[0];
	if (typeof listener !== 'function') {
		throw new TypeError('the store did not listen to the global settings');
	}
	return (ev) => {
		listener(ev);
	};
}

describe('LikeTargetStore', () => {
	beforeEach(() => {
		settingsMock.onDidReceiveGlobalSettings.mockReset();
	});

	it('should have no target before it is loaded', () => {
		expect(new LikeTargetStore(buildPort().port).current).toBeUndefined();
	});

	it('should load the target from the global settings', async () => {
		const { port } = buildPort({ likeTarget: TARGET });
		const store = new LikeTargetStore(port);

		await store.load();

		expect(store.current).toEqual(TARGET);
	});

	it('should have no target when the global settings are empty', async () => {
		const { port } = buildPort({});
		const store = new LikeTargetStore(port);

		await store.load();

		expect(store.current).toBeUndefined();
	});

	it('should have no target when the stored target is invalid', async () => {
		const { port } = buildPort({
			likeTarget: { uri: 3, name: 'x', kind: 'album' },
		});
		const store = new LikeTargetStore(port);

		await store.load();

		expect(store.current).toBeUndefined();
	});

	it('should write the target to the global settings when it is set', async () => {
		const { port, readStored } = buildPort();
		const store = new LikeTargetStore(port);

		await store.set(TARGET);

		expect(readStored()).toEqual({ likeTarget: TARGET });
	});

	it('should keep the language setting when the target is set', async () => {
		const { port, readStored } = buildPort({ language: 'fr' });
		const store = new LikeTargetStore(port);

		await store.set(TARGET);

		expect(readStored()).toEqual({ language: 'fr', likeTarget: TARGET });
	});

	it('should keep the target when the language is changed', async () => {
		const { port, readStored } = buildPort({});
		const store = new LikeTargetStore(port);
		const languageStore = new LanguageStore({
			settings: port,
			readSystemLocale: () => 'en_US.UTF-8',
			onError: vi.fn(),
		});
		await store.set(TARGET);

		await languageStore.save('fr');

		expect(readStored()).toEqual({ language: 'fr', likeTarget: TARGET });
	});

	it('should expose the target once it is set', async () => {
		const store = new LikeTargetStore(buildPort().port);

		await store.set(TARGET);

		expect(store.current).toEqual(TARGET);
	});

	it('should not change the target when writing the settings fails', async () => {
		const { port, write } = buildPort();
		write.mockRejectedValueOnce(new Error('offline'));
		const store = new LikeTargetStore(port);

		await expect(store.set(TARGET)).rejects.toThrow('offline');
		expect(store.current).toBeUndefined();
	});

	it('should notify the listeners when the target is set', async () => {
		const store = new LikeTargetStore(buildPort().port);
		const listener = vi.fn();
		store.subscribe(listener);

		await store.set(TARGET);

		expect(listener).toHaveBeenCalledWith(TARGET);
	});

	it('should notify the listeners when the settings are loaded', async () => {
		const { port } = buildPort({ likeTarget: TARGET });
		const store = new LikeTargetStore(port);
		const listener = vi.fn();
		store.subscribe(listener);

		await store.load();

		expect(listener).toHaveBeenCalledWith(TARGET);
	});

	it('should follow the global settings received from Stream Deck', () => {
		const store = new LikeTargetStore(buildPort().port);
		const listener = vi.fn();
		store.subscribe(listener);

		captureSettingsListener()({ settings: { likeTarget: TARGET } });

		expect(listener).toHaveBeenCalledWith(TARGET);
	});

	it('should clear the target when Stream Deck sends invalid settings', async () => {
		const store = new LikeTargetStore(buildPort().port);
		await store.set(TARGET);

		captureSettingsListener()({ settings: { likeTarget: 'nope' } });

		expect(store.current).toBeUndefined();
	});

	it('should not notify a listener that unsubscribed', async () => {
		const store = new LikeTargetStore(buildPort().port);
		const listener = vi.fn();
		const unsubscribe = store.subscribe(listener);
		unsubscribe();

		await store.set(TARGET);

		expect(listener).not.toHaveBeenCalled();
	});
});
