import { describe, expect, it, vi } from 'vitest';

import type { JsonObject } from './json_object';
import { mergeGlobalSettings } from './merge_global_settings';

function createPort(existing: unknown) {
	const write = vi.fn((_settings: JsonObject) => Promise.resolve());
	return { port: { read: () => Promise.resolve(existing), write }, write };
}

describe('mergeGlobalSettings', () => {
	it('should keep the other settings when it writes some', async () => {
		const { port, write } = createPort({ host: 'unit', language: 'fr' });

		await mergeGlobalSettings(port, { language: 'en' });

		expect(write).toHaveBeenCalledWith({ host: 'unit', language: 'en' });
	});

	it('should write the patch alone when there are no settings yet', async () => {
		const { port, write } = createPort({});

		await mergeGlobalSettings(port, { host: 'unit' });

		expect(write).toHaveBeenCalledWith({ host: 'unit' });
	});

	it.each([undefined, null, 'text', 42])(
		'should treat %j settings as empty',
		async (existing) => {
			const { port, write } = createPort(existing);

			await mergeGlobalSettings(port, { host: 'unit' });

			expect(write).toHaveBeenCalledWith({ host: 'unit' });
		}
	);
});
