const PERSONAL_PLUGIN_PREFIX = 'com.sonny93.';
const PERSONAL_SETTING_KEYS: ReadonlySet<string> = new Set([
	'device',
	'deviceId',
	'deviceName',
	'monitor',
	'selectedUri',
]);

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function scrubAction(action: unknown): unknown {
	if (
		!isRecord(action) ||
		typeof action['UUID'] !== 'string' ||
		!action['UUID'].startsWith(PERSONAL_PLUGIN_PREFIX) ||
		!isRecord(action['Settings'])
	) {
		return action;
	}
	const settings = Object.fromEntries(
		Object.entries(action['Settings']).filter(
			([key]) => !PERSONAL_SETTING_KEYS.has(key)
		)
	);
	return { ...action, Settings: settings };
}

function scrubController(controller: unknown): unknown {
	if (!isRecord(controller) || !isRecord(controller['Actions'])) {
		return controller;
	}
	const actions = Object.fromEntries(
		Object.entries(controller['Actions']).map(([position, action]) => [
			position,
			scrubAction(action),
		])
	);
	return { ...controller, Actions: actions };
}

/** Drops the device, playlist and monitor settings of this repo's actions from a parsed profile page manifest; any other JSON is returned as it is. */
export function removePersonalSettings(
	options: Readonly<{ manifest: unknown }>
): unknown {
	const { manifest } = options;
	if (!isRecord(manifest) || !Array.isArray(manifest['Controllers'])) {
		return manifest;
	}
	return {
		...manifest,
		Controllers: manifest['Controllers'].map(scrubController),
	};
}
