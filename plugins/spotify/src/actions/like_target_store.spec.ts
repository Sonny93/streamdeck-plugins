import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { LikeTarget } from './like_target';
import { LikeTargetStore } from './like_target_store';

const settingsMock = vi.hoisted(() => ({
	getGlobalSettings: vi.fn(),
	setGlobalSettings: vi.fn(),
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
		settingsMock.getGlobalSettings.mockReset();
		settingsMock.setGlobalSettings.mockReset();
		settingsMock.onDidReceiveGlobalSettings.mockReset();
		settingsMock.setGlobalSettings.mockResolvedValue(undefined);
	});

	it('should have no target before it is loaded', () => {
		expect(new LikeTargetStore().current).toBeUndefined();
	});

	it('should load the target from the global settings', async () => {
		settingsMock.getGlobalSettings.mockResolvedValue({ likeTarget: TARGET });
		const store = new LikeTargetStore();

		await store.load();

		expect(store.current).toEqual(TARGET);
	});

	it('should have no target when the global settings are empty', async () => {
		settingsMock.getGlobalSettings.mockResolvedValue({});
		const store = new LikeTargetStore();

		await store.load();

		expect(store.current).toBeUndefined();
	});

	it('should have no target when the stored target is invalid', async () => {
		settingsMock.getGlobalSettings.mockResolvedValue({
			likeTarget: { uri: 3, name: 'x', kind: 'album' },
		});
		const store = new LikeTargetStore();

		await store.load();

		expect(store.current).toBeUndefined();
	});

	it('should write the target to the global settings when it is set', async () => {
		const store = new LikeTargetStore();

		await store.set(TARGET);

		expect(settingsMock.setGlobalSettings).toHaveBeenCalledWith({
			likeTarget: TARGET,
		});
	});

	it('should expose the target once it is set', async () => {
		const store = new LikeTargetStore();

		await store.set(TARGET);

		expect(store.current).toEqual(TARGET);
	});

	it('should not change the target when writing the settings fails', async () => {
		settingsMock.setGlobalSettings.mockRejectedValue(new Error('offline'));
		const store = new LikeTargetStore();

		await expect(store.set(TARGET)).rejects.toThrow('offline');
		expect(store.current).toBeUndefined();
	});

	it('should notify the listeners when the target is set', async () => {
		const store = new LikeTargetStore();
		const listener = vi.fn();
		store.subscribe(listener);

		await store.set(TARGET);

		expect(listener).toHaveBeenCalledWith(TARGET);
	});

	it('should notify the listeners when the settings are loaded', async () => {
		settingsMock.getGlobalSettings.mockResolvedValue({ likeTarget: TARGET });
		const store = new LikeTargetStore();
		const listener = vi.fn();
		store.subscribe(listener);

		await store.load();

		expect(listener).toHaveBeenCalledWith(TARGET);
	});

	it('should follow the global settings received from Stream Deck', () => {
		const store = new LikeTargetStore();
		const listener = vi.fn();
		store.subscribe(listener);

		captureSettingsListener()({ settings: { likeTarget: TARGET } });

		expect(listener).toHaveBeenCalledWith(TARGET);
	});

	it('should clear the target when Stream Deck sends invalid settings', async () => {
		const store = new LikeTargetStore();
		await store.set(TARGET);

		captureSettingsListener()({ settings: { likeTarget: 'nope' } });

		expect(store.current).toBeUndefined();
	});

	it('should not notify a listener that unsubscribed', async () => {
		const store = new LikeTargetStore();
		const listener = vi.fn();
		const unsubscribe = store.subscribe(listener);
		unsubscribe();

		await store.set(TARGET);

		expect(listener).not.toHaveBeenCalled();
	});
});
