import { describe, expect, it, vi } from 'vitest';

import type { LanguageSetting } from '../i18n/language_setting';
import { LanguagePanel } from './language_panel';

function createPanel(initial: LanguageSetting = 'system') {
	const state = { setting: initial };
	const save = vi.fn((setting: LanguageSetting) => {
		state.setting = setting;
		return Promise.resolve();
	});
	const reply = vi.fn((_actionId: string, _event: string, _payload: unknown) =>
		Promise.resolve()
	);
	const panel = new LanguagePanel({
		languageStore: {
			get setting() {
				return state.setting;
			},
			get current() {
				return state.setting === 'fr' ? 'fr' : 'en';
			},
			save,
		},
		reply,
	});
	return { panel, save, reply };
}

describe('LanguagePanel', () => {
	it('should answer a request for the language with the setting and the language', async () => {
		const { panel, reply } = createPanel('fr');

		const isHandled = await panel.handle('action', { event: 'getLanguage' });

		expect(isHandled).toBe(true);
		expect(reply).toHaveBeenCalledWith('action', 'language', {
			event: 'language',
			setting: 'fr',
			language: 'fr',
		});
	});

	it('should save the language an inspector sends, then answer with the new one', async () => {
		const { panel, save, reply } = createPanel();

		await panel.handle('action', { event: 'saveLanguage', setting: 'fr' });

		expect(save).toHaveBeenCalledWith('fr');
		expect(reply).toHaveBeenCalledWith('action', 'language', {
			event: 'language',
			setting: 'fr',
			language: 'fr',
		});
	});

	it.each([
		{ event: 'saveLanguage', setting: 'de' },
		{ event: 'saveLanguage' },
		{ event: 'getUnitAddress' },
		'text',
		null,
	])('should leave the message %j to the plugin', async (payload) => {
		const { panel, save, reply } = createPanel();

		expect(await panel.handle('action', payload)).toBe(false);
		expect(save).not.toHaveBeenCalled();
		expect(reply).not.toHaveBeenCalled();
	});

	it('should announce the current setting when an inspector appears', async () => {
		const { panel, reply } = createPanel('en');

		await panel.announce('action');

		expect(reply).toHaveBeenCalledWith('action', 'language', {
			event: 'language',
			setting: 'en',
			language: 'en',
		});
	});

	it('should not answer when saving fails, and let the error out', async () => {
		const { panel, save, reply } = createPanel();
		save.mockRejectedValueOnce(new Error('Disk full'));

		await expect(
			panel.handle('action', { event: 'saveLanguage', setting: 'en' })
		).rejects.toThrow('Disk full');
		expect(reply).not.toHaveBeenCalled();
	});
});
