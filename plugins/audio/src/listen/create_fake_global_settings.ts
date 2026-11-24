import type { GlobalSettingsPort } from 'deck-kit/settings/global_settings_port';
import type { JsonObject } from 'deck-kit/settings/json_object';

export type FakeGlobalSettings = Readonly<{
	port: GlobalSettingsPort;
	writes: JsonObject[];
	current: () => unknown;
}>;

/** Global settings held in memory, recording every write. */
export function createFakeGlobalSettings(initial: unknown): FakeGlobalSettings {
	let stored = initial;
	const writes: JsonObject[] = [];
	return {
		port: {
			read: () => Promise.resolve(stored),
			write: (settings) => {
				writes.push(settings);
				stored = settings;
				return Promise.resolve();
			},
		},
		writes,
		current: () => stored,
	};
}
