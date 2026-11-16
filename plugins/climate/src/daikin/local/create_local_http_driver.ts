import { parseBasicInfo } from '../protocol/parse_basic_info';
import type { UnitDriver } from '../unit_driver';
import type { UnitIdentity } from '../unit_types';
import { createUnitRequester } from './create_unit_requester';
import { withHostLock } from './host_lock';
import { mapCapabilities } from './map_capabilities';
import { mapEnergy } from './map_energy';
import { readSnapshot } from './read_snapshot';
import { UNIT_PATHS } from './unit_paths';
import type { UnitRequester } from './unit_requester';
import { validateDesiredState } from './validate_desired_state';
import { writeSpecialMode } from './write_special_mode';
import { writeUnitState } from './write_unit_state';

async function readIdentity(request: UnitRequester): Promise<UnitIdentity> {
	const info = parseBasicInfo(await request(UNIT_PATHS.basicInfo));
	return {
		name: info.name,
		mac: info.mac,
		firmwareVersion: info.firmwareVersion,
		apiFamily: info.apiFamily,
	};
}

const DEFAULT_TIMEOUT_MS = 5000;
const MINIMUM_POLL_INTERVAL_MS = 10_000;

export type LocalHttpDriverOptions = {
	readonly host: string;
	readonly timeoutMs?: number;
};

export function createLocalHttpDriver(
	options: Readonly<LocalHttpDriverOptions>
): UnitDriver {
	const { host, timeoutMs = DEFAULT_TIMEOUT_MS } = options;
	const request = createUnitRequester(host, timeoutMs);
	return {
		hints: { minimumPollIntervalMs: MINIMUM_POLL_INTERVAL_MS },
		readSnapshot: () => withHostLock(host, () => readSnapshot(request)),
		writeState: async (desired) => {
			validateDesiredState(desired, desired.mode);
			return withHostLock(host, () => writeUnitState(request, host, desired));
		},
		writeSpecialMode: (mode, isActive) =>
			withHostLock(host, () => writeSpecialMode(request, host, mode, isActive)),
		readCapabilities: async () =>
			mapCapabilities(await request(UNIT_PATHS.modelInfo)),
		readEnergy: () =>
			withHostLock(host, async () =>
				mapEnergy(await request(UNIT_PATHS.weekPowerEx))
			),
		readIdentity: () => withHostLock(host, () => readIdentity(request)),
	};
}
