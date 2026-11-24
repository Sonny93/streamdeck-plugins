import { listenSettingsSchema } from './listen_settings_schema';
import type { ListenTarget } from './listen_target';
import { parseMaximumLevelPercent } from './parse_maximum_level_percent';

const PERCENT = 100;

/** Reads the input and the ceiling an action works on from its raw settings; missing or invalid settings give no input and the default ceiling. */
export function readListenTarget(rawSettings: unknown): ListenTarget {
	const parsed = listenSettingsSchema.safeParse(rawSettings);
	const settings = parsed.success ? parsed.data : {};
	const device = settings.device?.trim();
	return {
		sourceId: device === undefined || device === '' ? undefined : device,
		maximumLevel: parseMaximumLevelPercent(settings.maximumLevel) / PERCENT,
	};
}
