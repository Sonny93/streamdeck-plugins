import { acquireOutPointer } from '../windows/acquire_out_pointer';
import { checkHresult } from '../windows/check_hresult';
import { ComError } from '../windows/com_error';
import type { NativePointer } from '../windows/native_pointer';
import { useComObject } from '../windows/use_com_object';
import type { AudioDevice } from './audio_device';
import type { CoreAudio } from './core_audio';
import { CoreAudioConstants } from './core_audio_constants';
import type { CoreAudioContext } from './core_audio_context';

const { slots } = CoreAudioConstants;

function readDeviceId(
	context: CoreAudioContext,
	device: NativePointer
): string {
	const { runtime, prototypes } = context;
	const getId = runtime.method(device, slots.deviceGetId, prototypes.getId);
	return runtime.takeTaskString(
		acquireOutPointer('IMMDevice.GetId', (out) => getId(out))
	);
}

/** Reads the name the sound settings show, `undefined` when the device has none. */
function readDeviceName(
	context: CoreAudioContext,
	device: NativePointer
): string | undefined {
	const { runtime, prototypes } = context;
	const store = acquireOutPointer('IMMDevice.OpenPropertyStore', (out) =>
		runtime.method(
			device,
			slots.deviceOpenPropertyStore,
			prototypes.openPropertyStore
		)(CoreAudioConstants.readAccess, out)
	);
	return useComObject(runtime, store, () => {
		const { friendlyNameKey } = CoreAudioConstants;
		const value = new Uint8Array(CoreAudioConstants.propVariantSize);
		checkHresult(
			'IPropertyStore.GetValue',
			runtime.method(
				store,
				slots.propertyStoreGetValue,
				prototypes.getValue
			)(
				{ fmtid: runtime.guidOf(friendlyNameKey.set), pid: friendlyNameKey.id },
				value
			)
		);
		try {
			const variantType = new DataView(value.buffer).getUint16(0, true);
			if (variantType !== CoreAudioConstants.wideStringVariantType) {
				return undefined;
			}
			const name: unknown = runtime.koffi.decode(
				value,
				CoreAudioConstants.propVariantValueOffset,
				'str16'
			);
			return typeof name === 'string' ? name : undefined;
		} finally {
			runtime.clearPropVariant(value);
		}
	});
}

function readCount(
	context: CoreAudioContext,
	collection: NativePointer
): number {
	const { runtime, prototypes } = context;
	const count = [0];
	checkHresult(
		'IMMDeviceCollection.GetCount',
		runtime.method(
			collection,
			slots.collectionGetCount,
			prototypes.getCount
		)(count)
	);
	return count[0] ?? 0;
}

/** Binds the listing of the active devices and the reading of the default ones. */
export function bindDeviceListing(
	context: CoreAudioContext
): Pick<CoreAudio, 'listDevices' | 'readDefaultDeviceId'> {
	const { runtime, prototypes, enumerator } = context;
	return {
		listDevices: (flow) => {
			const collection = acquireOutPointer(
				'IMMDeviceEnumerator.EnumAudioEndpoints',
				(out) =>
					runtime.method(
						enumerator,
						slots.enumAudioEndpoints,
						prototypes.enumAudioEndpoints
					)(
						CoreAudioConstants.dataFlows[flow],
						CoreAudioConstants.activeDeviceState,
						out
					)
			);
			return useComObject(runtime, collection, () => {
				const item = runtime.method(
					collection,
					slots.collectionItem,
					prototypes.item
				);
				const count = readCount(context, collection);
				const devices: AudioDevice[] = [];
				for (let index = 0; index < count; index += 1) {
					try {
						const device = acquireOutPointer(
							'IMMDeviceCollection.Item',
							(out) => item(index, out)
						);
						useComObject(runtime, device, () => {
							const id = readDeviceId(context, device);
							devices.push({
								id,
								name: readDeviceName(context, device) ?? id,
								flow,
							});
						});
					} catch {
						// A device that went away while listing is skipped.
					}
				}
				return devices;
			});
		},
		readDefaultDeviceId: (flow) => {
			try {
				const device = acquireOutPointer(
					'IMMDeviceEnumerator.GetDefaultAudioEndpoint',
					(out) =>
						runtime.method(
							enumerator,
							slots.getDefaultAudioEndpoint,
							prototypes.getDefaultAudioEndpoint
						)(
							CoreAudioConstants.dataFlows[flow],
							CoreAudioConstants.consoleRole,
							out
						)
				);
				return useComObject(runtime, device, () =>
					readDeviceId(context, device)
				);
			} catch (error) {
				if (error instanceof ComError) {
					return undefined;
				}
				throw error;
			}
		},
	};
}
