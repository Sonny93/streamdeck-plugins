import { playlistsDialSettingsSchema } from './playlists_dial_settings_schema';

/** Reads the selected playlist URI from a dial's raw settings; missing or invalid settings mean no selection. */
export function readSelectedUri(rawSettings: unknown): string | undefined {
	const parsed = playlistsDialSettingsSchema.safeParse(rawSettings);
	return parsed.success ? parsed.data.selectedUri : undefined;
}
