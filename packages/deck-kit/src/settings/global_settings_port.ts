import type { JsonObject } from './json_object';

/** Where the global settings of a plugin are read and written; the Stream Deck SDK gives it, tests fake it. */
export type GlobalSettingsPort = Readonly<{
	read: () => Promise<unknown>;
	write: (settings: JsonObject) => Promise<void>;
}>;
