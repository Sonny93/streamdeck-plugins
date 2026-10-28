import type koffiModule from 'koffi';

import type { AudioSessionChange } from './audio_session_change';
import type { AudioSessionSnapshot } from './audio_session_snapshot';
import type { CoreAudio } from './core_audio';
import { CoreAudioConstants } from './core_audio_constants';
import { CoreAudioError } from './core_audio_error';
import { parseGuid } from './parse_guid';

type Koffi = typeof koffiModule;
type TypeObject = ReturnType<Koffi['proto']>;
type ComMethod = (...args: unknown[]) => number;

const { slots } = CoreAudioConstants;
const NO_EVENT_CONTEXT = null;
const GUID_TYPE_NAME = 'GUID';
const GUID_TAIL_LENGTH = 8;

type Bindings = Readonly<{
	koffi: Koffi;
	guidOf: (text: string) => unknown;
	protos: Readonly<Record<string, TypeObject>>;
	createInstance: (...args: unknown[]) => number;
	readProcessImagePath: (processId: number) => string | undefined;
}>;

function declareProtos(koffi: Koffi): Readonly<Record<string, TypeObject>> {
	return {
		release: koffi.proto('uint32 __stdcall ComRelease(void *self)'),
		queryInterface: koffi.proto(
			'int32 __stdcall ComQueryInterface(void *self, GUID *iid, _Out_ void **object)'
		),
		enumAudioEndpoints: koffi.proto(
			'int32 __stdcall ComEnumAudioEndpoints(void *self, int32 flow, uint32 mask, _Out_ void **collection)'
		),
		getCount: koffi.proto(
			'int32 __stdcall ComGetCount(void *self, _Out_ uint32 *count)'
		),
		item: koffi.proto(
			'int32 __stdcall ComItem(void *self, uint32 index, _Out_ void **item)'
		),
		activate: koffi.proto(
			'int32 __stdcall ComActivate(void *self, GUID *iid, uint32 context, void *parameters, _Out_ void **object)'
		),
		getObject: koffi.proto(
			'int32 __stdcall ComGetObject(void *self, _Out_ void **object)'
		),
		getProcessId: koffi.proto(
			'int32 __stdcall ComGetProcessId(void *self, _Out_ uint32 *processId)'
		),
		setMasterVolume: koffi.proto(
			'int32 __stdcall ComSetMasterVolume(void *self, float level, void *eventContext)'
		),
		getMasterVolume: koffi.proto(
			'int32 __stdcall ComGetMasterVolume(void *self, _Out_ float *level)'
		),
		setMute: koffi.proto(
			'int32 __stdcall ComSetMute(void *self, int32 isMuted, void *eventContext)'
		),
		getMute: koffi.proto(
			'int32 __stdcall ComGetMute(void *self, _Out_ int32 *isMuted)'
		),
	};
}

function protoOf(bindings: Bindings, name: string): TypeObject {
	const proto = bindings.protos[name];
	if (proto === undefined) {
		throw new TypeError(`Unknown COM prototype "${name}".`);
	}
	return proto;
}

function method(
	bindings: Bindings,
	object: unknown,
	options: Readonly<{ slot: number; proto: string }>
): ComMethod {
	const { koffi } = bindings;
	const vtable: unknown = koffi.decode(object, 'void *');
	const pointerSize = koffi.sizeof('void *');
	const target: unknown = koffi.decode(
		vtable,
		options.slot * pointerSize,
		'void *'
	);
	const proto = protoOf(bindings, options.proto);
	return (...args) => koffi.call(target, proto, object, ...args) as number;
}

function check(call: string, result: number): void {
	if (result < 0) {
		throw new CoreAudioError({ call, result });
	}
}

function release(bindings: Bindings, object: unknown): void {
	method(bindings, object, { slot: slots.release, proto: 'release' })();
}

function withObject<T>(
	bindings: Bindings,
	acquire: (out: unknown[]) => number,
	call: string,
	use: (object: unknown) => T
): T {
	const out: unknown[] = [null];
	check(call, acquire(out));
	const object = out[0];
	if (object === null || object === undefined) {
		throw new CoreAudioError({ call, result: -1 });
	}
	try {
		return use(object);
	} finally {
		release(bindings, object);
	}
}

function readCount(bindings: Bindings, object: unknown, slot: number): number {
	const count = [0];
	check(
		'GetCount',
		method(bindings, object, { slot, proto: 'getCount' })(count)
	);
	return count[0] ?? 0;
}

type SessionVisitor = (session: AudioSessionSnapshot, volume: unknown) => void;

function visitSession(
	bindings: Bindings,
	control: unknown,
	visit: SessionVisitor
): void {
	const queryInterface = method(bindings, control, {
		slot: slots.queryInterface,
		proto: 'queryInterface',
	});
	const processId = withObject(
		bindings,
		(out) =>
			queryInterface(
				bindings.guidOf(CoreAudioConstants.audioSessionControl2InterfaceId),
				out
			),
		'QueryInterface(IAudioSessionControl2)',
		(control2) => {
			const value = [0];
			const result = method(bindings, control2, {
				slot: slots.getProcessId,
				proto: 'getProcessId',
			})(value);
			return result === 0 ? (value[0] ?? 0) : 0;
		}
	);
	withObject(
		bindings,
		(out) =>
			queryInterface(
				bindings.guidOf(CoreAudioConstants.simpleAudioVolumeInterfaceId),
				out
			),
		'QueryInterface(ISimpleAudioVolume)',
		(volume) => {
			const level = [0];
			const muted = [0];
			check(
				'GetMasterVolume',
				method(bindings, volume, {
					slot: slots.getMasterVolume,
					proto: 'getMasterVolume',
				})(level)
			);
			check(
				'GetMute',
				method(bindings, volume, { slot: slots.getMute, proto: 'getMute' })(
					muted
				)
			);
			visit(
				{
					processId,
					imagePath:
						processId === 0
							? undefined
							: bindings.readProcessImagePath(processId),
					volume: level[0] ?? 0,
					isMuted: (muted[0] ?? 0) !== 0,
				},
				volume
			);
		}
	);
}

function visitDevice(
	bindings: Bindings,
	device: unknown,
	visit: SessionVisitor
): void {
	withObject(
		bindings,
		(out) =>
			method(bindings, device, {
				slot: slots.deviceActivate,
				proto: 'activate',
			})(
				bindings.guidOf(CoreAudioConstants.audioSessionManager2InterfaceId),
				CoreAudioConstants.classContextAll,
				null,
				out
			),
		'IMMDevice.Activate',
		(manager) =>
			withObject(
				bindings,
				(out) =>
					method(bindings, manager, {
						slot: slots.getSessionEnumerator,
						proto: 'getObject',
					})(out),
				'GetSessionEnumerator',
				(sessions) => {
					const count = readCount(
						bindings,
						sessions,
						slots.sessionEnumeratorGetCount
					);
					const getSession = method(bindings, sessions, {
						slot: slots.sessionEnumeratorGetSession,
						proto: 'item',
					});
					for (let index = 0; index < count; index += 1) {
						try {
							withObject(
								bindings,
								(out) => getSession(index, out),
								'GetSession',
								(control) => visitSession(bindings, control, visit)
							);
						} catch {
							// A session that vanished or refuses inspection is skipped.
						}
					}
				}
			)
	);
}

function visitAllSessions(bindings: Bindings, visit: SessionVisitor): void {
	withObject(
		bindings,
		(out) =>
			bindings.createInstance(
				bindings.guidOf(CoreAudioConstants.mmDeviceEnumeratorClassId),
				null,
				CoreAudioConstants.classContextAll,
				bindings.guidOf(CoreAudioConstants.mmDeviceEnumeratorInterfaceId),
				out
			),
		'CoCreateInstance(MMDeviceEnumerator)',
		(enumerator) =>
			withObject(
				bindings,
				(out) =>
					method(bindings, enumerator, {
						slot: slots.enumAudioEndpoints,
						proto: 'enumAudioEndpoints',
					})(
						CoreAudioConstants.renderDataFlow,
						CoreAudioConstants.activeDeviceState,
						out
					),
				'EnumAudioEndpoints',
				(devices) => {
					const count = readCount(bindings, devices, slots.collectionGetCount);
					const item = method(bindings, devices, {
						slot: slots.collectionItem,
						proto: 'item',
					});
					for (let index = 0; index < count; index += 1) {
						try {
							withObject(
								bindings,
								(out) => item(index, out),
								'IMMDeviceCollection.Item',
								(device) => visitDevice(bindings, device, visit)
							);
						} catch {
							// A device that went away while listing is skipped.
						}
					}
				}
			)
	);
}

function applyChange(
	bindings: Bindings,
	volume: unknown,
	change: AudioSessionChange
): void {
	if (change.volume !== undefined) {
		check(
			'SetMasterVolume',
			method(bindings, volume, {
				slot: slots.setMasterVolume,
				proto: 'setMasterVolume',
			})(change.volume, NO_EVENT_CONTEXT)
		);
	}
	if (change.isMuted !== undefined) {
		check(
			'SetMute',
			method(bindings, volume, { slot: slots.setMute, proto: 'setMute' })(
				change.isMuted ? 1 : 0,
				NO_EVENT_CONTEXT
			)
		);
	}
}

function bindReadProcessImagePath(
	koffi: Koffi
): (processId: number) => string | undefined {
	const kernel32 = koffi.load('kernel32.dll');
	const openProcess = kernel32.func(
		'void *__stdcall OpenProcess(uint32 access, bool inherit, uint32 processId)'
	);
	const closeHandle = kernel32.func('bool __stdcall CloseHandle(void *handle)');
	const queryFullProcessImageName = kernel32.func(
		'bool __stdcall QueryFullProcessImageNameW(void *process, uint32 flags, _Out_ uint16 *name, _Inout_ uint32 *size)'
	);
	return (processId) => {
		const process: unknown = openProcess(
			CoreAudioConstants.processQueryLimitedInformation,
			false,
			processId
		);
		if (process === null) {
			return undefined;
		}
		try {
			const name = new Uint16Array(CoreAudioConstants.imagePathMaxLength);
			const size = [CoreAudioConstants.imagePathMaxLength];
			if (queryFullProcessImageName(process, 0, name, size) !== true) {
				return undefined;
			}
			return String.fromCharCode(...name.subarray(0, size[0]));
		} finally {
			closeHandle(process);
		}
	};
}

function declareGuidType(koffi: Koffi): void {
	try {
		koffi.type(GUID_TYPE_NAME);
	} catch {
		koffi.struct(GUID_TYPE_NAME, {
			Data1: 'uint32',
			Data2: 'uint16',
			Data3: 'uint16',
			Data4: koffi.array('uint8', GUID_TAIL_LENGTH),
		});
	}
}

function declareCoreAudio(koffi: Koffi): CoreAudio {
	declareGuidType(koffi);
	const ole32 = koffi.load('ole32.dll');
	const initialize = ole32.func(
		'int32 __stdcall CoInitializeEx(void *reserved, uint32 model)'
	);
	const initialized = initialize(
		null,
		CoreAudioConstants.multithreadedApartment
	) as number;
	if (
		initialized < 0 &&
		initialized >>> 0 !== CoreAudioConstants.changedModeResult
	) {
		throw new CoreAudioError({ call: 'CoInitializeEx', result: initialized });
	}
	const guids = new Map<string, unknown>();
	const bindings: Bindings = {
		koffi,
		protos: declareProtos(koffi),
		guidOf: (text) => {
			const cached = guids.get(text) ?? parseGuid(text);
			guids.set(text, cached);
			return cached;
		},
		createInstance: ole32.func(
			'int32 __stdcall CoCreateInstance(GUID *classId, void *outer, uint32 context, GUID *interfaceId, _Out_ void **object)'
		) as (...args: unknown[]) => number,
		readProcessImagePath: bindReadProcessImagePath(koffi),
	};
	return {
		listSessions: () => {
			const sessions: AudioSessionSnapshot[] = [];
			visitAllSessions(bindings, (session) => sessions.push(session));
			return sessions;
		},
		updateSessions: (select, change) => {
			let updated = 0;
			visitAllSessions(bindings, (session, volume) => {
				if (select(session)) {
					applyChange(bindings, volume, change);
					updated += 1;
				}
			});
			return updated;
		},
		readProcessImagePath: bindings.readProcessImagePath,
	};
}

let cachedCoreAudio: Promise<CoreAudio> | undefined;

/**
 * Loads koffi lazily and binds the Windows Core Audio interfaces, once.
 * Every call walks the audio sessions of all active output devices and releases each COM object it obtained.
 */
export function loadCoreAudio(): Promise<CoreAudio> {
	cachedCoreAudio ??= import('koffi')
		.then((module) => declareCoreAudio(module.default))
		.catch((error: unknown) => {
			cachedCoreAudio = undefined;
			throw error;
		});
	return cachedCoreAudio;
}
