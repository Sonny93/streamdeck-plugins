const PERSONAL_PLUGIN_PREFIX = 'com.sonny93.';
const PERSONAL_SETTING_KEYS: ReadonlySet<string> = new Set([
	'appImageName',
	'device',
	'deviceId',
	'deviceName',
	'monitor',
	'selectedUri',
]);

const FIXED_SETTING_VALUES: Readonly<Record<string, ReadonlySet<string>>> =
	Object.freeze({
		device: new Set(['default:output', 'default:input']),
		monitor: new Set(['all', 'primary']),
	});

function isFixedSettingValue(key: string, value: unknown): boolean {
	return (
		typeof value === 'string' &&
		(FIXED_SETTING_VALUES[key]?.has(value) ?? false)
	);
}

const APP_TARGET_KEY = 'target';
const LABEL_KEY = 'label';
const PERSONAL_LABEL_ACTION_UUIDS: ReadonlySet<string> = new Set([
	'com.sonny93.audio.default-output',
	'com.sonny93.spotify.play-on-device',
]);

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function scrubSettings(
	options: Readonly<{ actionUuid: string; settings: Record<string, unknown> }>
): Record<string, unknown> {
	const { actionUuid, settings } = options;
	const removedKeys = new Set(PERSONAL_SETTING_KEYS);
	if ('appImageName' in settings) {
		removedKeys.add(APP_TARGET_KEY);
	}
	if (PERSONAL_LABEL_ACTION_UUIDS.has(actionUuid)) {
		removedKeys.add(LABEL_KEY);
	}
	return Object.fromEntries(
		Object.entries(settings).filter(
			([key, value]) => !removedKeys.has(key) || isFixedSettingValue(key, value)
		)
	);
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
	const settings = scrubSettings({
		actionUuid: action['UUID'],
		settings: action['Settings'],
	});
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

/** Drops the device, playlist, monitor and app settings (except a `device` or `monitor` that is one of the plugins' fixed values, such as `default:output` or `all`) of this repo's actions (and the target that goes with an app, and the label of the default-output and play-on-device keys) from a parsed profile page manifest; any other JSON is returned as it is. */
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
