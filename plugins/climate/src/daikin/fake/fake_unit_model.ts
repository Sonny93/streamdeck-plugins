import { UNIT_PATHS } from '../local/unit_paths';
import type { RawRecord } from '../raw_record';
import { applySetControlInfo } from './apply_set_control_info';
import { applySpecialMode } from './apply_special_mode';
import { FAKE_UNIT_DEFAULTS } from './fake_unit_defaults';
import { serializeWireRecord } from './serialize_wire_record';

const WRITE_PATHS: readonly string[] = [
	UNIT_PATHS.setControlInfo,
	UNIT_PATHS.setSpecialMode,
];

export type FakeUnitKind = 'aircon' | 'cloud-only';

export type FakeUnitOptions = {
	readonly kind?: FakeUnitKind;
	readonly basicInfo?: RawRecord;
	readonly modelInfo?: RawRecord;
	readonly sensorInfo?: RawRecord;
	readonly controlInfo?: RawRecord;
	readonly weekPowerEx?: RawRecord;
};

type FakeHttpReply = { readonly status: number; readonly body: string };

export type FakeUnitModel = {
	readonly reply: (path: string, query: RawRecord) => FakeHttpReply;
	readonly recordCommand: (path: string, query: RawRecord) => void;
	readonly applyRemoteChange: (change: RawRecord) => void;
	readonly setSensors: (change: RawRecord) => void;
	readonly readControl: () => RawRecord;
	readonly readCommands: () => readonly RawRecord[];
};

/** observed: the GPF modules answer 404 `Page Not Found` on every path. */
const NOT_FOUND: FakeHttpReply = { status: 404, body: 'Page Not Found' };

function ok(record: RawRecord): FakeHttpReply {
	return { status: 200, body: serializeWireRecord('OK', record) };
}

/** assumed: a refused SET answers 200 with `ret=PARAM NG,adv=`. */
const PARAM_NG: FakeHttpReply = { status: 200, body: 'ret=PARAM NG,adv=' };

export function createFakeUnitModel(
	options: Readonly<FakeUnitOptions>
): FakeUnitModel {
	const kind = options.kind ?? 'aircon';
	const basicInfo = {
		...FAKE_UNIT_DEFAULTS.basicInfo,
		...options.basicInfo,
	};
	const modelInfo = {
		...FAKE_UNIT_DEFAULTS.modelInfo,
		...options.modelInfo,
	};
	let sensorInfo: RawRecord = {
		...FAKE_UNIT_DEFAULTS.sensorInfo,
		...options.sensorInfo,
	};
	let controlInfo: RawRecord = {
		...FAKE_UNIT_DEFAULTS.controlInfo,
		...options.controlInfo,
	};
	const weekPowerEx = {
		...FAKE_UNIT_DEFAULTS.weekPowerEx,
		...options.weekPowerEx,
	};
	let commands: readonly RawRecord[] = [];

	function applyCommand(query: RawRecord): FakeHttpReply {
		const updated = applySetControlInfo(controlInfo, modelInfo, query);
		if (updated === null) return PARAM_NG;
		controlInfo = updated;
		return ok({ adv: '' });
	}

	function applySpecialModeCommand(query: RawRecord): FakeHttpReply {
		const advanced = applySpecialMode(controlInfo['adv'] ?? '', query);
		if (advanced === null) return PARAM_NG;
		controlInfo = { ...controlInfo, adv: advanced };
		return ok({ adv: advanced });
	}

	function reply(path: string, query: RawRecord): FakeHttpReply {
		if (kind === 'cloud-only') return NOT_FOUND;
		if (path === UNIT_PATHS.basicInfo) return ok(basicInfo);
		if (path === UNIT_PATHS.modelInfo) return ok(modelInfo);
		if (path === UNIT_PATHS.sensorInfo) return ok(sensorInfo);
		if (path === UNIT_PATHS.controlInfo) return ok(controlInfo);
		if (path === UNIT_PATHS.weekPowerEx) return ok(weekPowerEx);
		if (path === UNIT_PATHS.setControlInfo) return applyCommand(query);
		if (path === UNIT_PATHS.setSpecialMode) {
			return applySpecialModeCommand(query);
		}
		return NOT_FOUND;
	}

	return {
		reply,
		recordCommand: (path, query) => {
			if (!WRITE_PATHS.includes(path)) return;
			commands = [...commands, query];
		},
		applyRemoteChange: (change) => {
			controlInfo = { ...controlInfo, ...change };
		},
		setSensors: (change) => {
			sensorInfo = { ...sensorInfo, ...change };
		},
		readControl: () => controlInfo,
		readCommands: () => commands,
	};
}
