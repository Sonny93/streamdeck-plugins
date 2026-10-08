import type { ManifestAction } from './manifest_action.ts';

/** The parts of the plugin manifest that the generated profile depends on. */
export type PluginManifest = Readonly<{
	name: string;
	uuid: string;
	version: string;
	actions: readonly ManifestAction[];
}>;
