import { describe, expect, it, vi } from 'vitest';

import type { JsonObject } from '../settings/json_object';
import { LanguageStore } from './language_store';

function createStore(stored: unknown, systemLocale = 'en_US.UTF-8') {
	let current: unknown = stored;
	const write = vi.fn((settings: JsonObject) => {
		current = settings;
		return Promise.resolve();
	});
	const readSystemLocale = vi.fn(() => systemLocale);
	const onError = vi.fn();
	const store = new LanguageStore({
		settings: { read: () => Promise.resolve(current), write },
		readSystemLocale,
		onError,
	});
	return { store, write, readSystemLocale, onError };
}

describe('LanguageStore', () => {
	it('should follow the system before anything is loaded', () => {
		const { store } = createStore({}, 'fr_FR.UTF-8');

		expect([store.setting, store.current]).toEqual(['system', 'fr']);
	});

	it('should read the system locale once', () => {
		const { store, readSystemLocale } = createStore({});

		void store.current;
		void store.current;

		expect(readSystemLocale).toHaveBeenCalledTimes(1);
	});

	it('should load the setting from the global settings', async () => {
		const { store } = createStore({ language: 'fr' });

		await store.load();

		expect([store.setting, store.current]).toEqual(['fr', 'fr']);
	});

	it.each([{}, { language: 'de' }, { language: 3 }, null, 'text'])(
		'should follow the system when the stored settings are %j',
		async (stored) => {
			const { store } = createStore(stored, 'fr_FR.UTF-8');

			await store.load();

			expect([store.setting, store.current]).toEqual(['system', 'fr']);
		}
	);

	it('should save the setting next to the other global settings and apply it', async () => {
		const { store, write } = createStore({ host: 'unit' });

		await store.save('fr');

		expect(write).toHaveBeenCalledWith({ host: 'unit', language: 'fr' });
		expect(store.current).toBe('fr');
	});

	it('should tell the listeners when the language changes', async () => {
		const { store } = createStore({});
		const listener = vi.fn();
		store.subscribe(listener);

		await store.save('fr');

		expect(listener).toHaveBeenCalledTimes(1);
	});

	it('should not tell the listeners when the setting does not change', async () => {
		const { store } = createStore({ language: 'fr' });
		await store.load();
		const listener = vi.fn();
		store.subscribe(listener);

		await store.save('fr');

		expect(listener).not.toHaveBeenCalled();
	});

	it('should tell the listeners when following the system gives another language than forcing one', async () => {
		const { store } = createStore({ language: 'en' }, 'fr_FR.UTF-8');
		await store.load();
		const listener = vi.fn();
		store.subscribe(listener);

		await store.save('system');

		expect([listener.mock.calls.length, store.current]).toEqual([1, 'fr']);
	});

	it('should stop telling a listener that unsubscribed', async () => {
		const { store } = createStore({});
		const listener = vi.fn();
		store.subscribe(listener)();

		await store.save('fr');

		expect(listener).not.toHaveBeenCalled();
	});

	it('should report a failing listener without stopping the others', async () => {
		const { store, onError } = createStore({});
		const failure = new Error('Cannot draw');
		const second = vi.fn();
		store.subscribe(() => {
			throw failure;
		});
		store.subscribe(second);

		await store.save('fr');

		expect(onError).toHaveBeenCalledWith(failure);
		expect(second).toHaveBeenCalled();
	});

	it('should keep the previous setting when the write fails', async () => {
		const { store, write } = createStore({});
		write.mockRejectedValueOnce(new Error('Disk full'));

		await expect(store.save('fr')).rejects.toThrow('Disk full');
		expect(store.setting).toBe('system');
	});
});
