import { onceAsync } from '../shared/once_async';
import type { DisplayConfigApi } from './display_config_api';
import { DisplayConfigError } from './display_config_error';
import { loadUser32 } from './load_user32';
import { Win32Constants } from './win32_constants';

const PATH_INFO_SIZE = 72;
const MODE_INFO_SIZE = 64;
const NO_TOPOLOGY = null;

function assertSuccess(call: string, result: unknown): void {
	if (result !== Win32Constants.errorSuccess) {
		throw new DisplayConfigError({ call, result });
	}
}

/** Loads koffi lazily and binds the display configuration functions of user32, once. */
export const loadDisplayConfigApi = onceAsync(
	async (): Promise<DisplayConfigApi> => {
		const library = await loadUser32();
		const getBufferSizes = library.func(
			'int32 __stdcall GetDisplayConfigBufferSizes(uint32 flags, _Out_ uint32 *pathCount, _Out_ uint32 *modeCount)'
		);
		const queryDisplayConfig = library.func(
			'int32 __stdcall QueryDisplayConfig(uint32 flags, _Inout_ uint32 *pathCount, void *paths, _Inout_ uint32 *modeCount, void *modes, void *topology)'
		);
		const getDeviceInfo = library.func(
			'int32 __stdcall DisplayConfigGetDeviceInfo(void *packet)'
		);
		const setDeviceInfo = library.func(
			'int32 __stdcall DisplayConfigSetDeviceInfo(void *packet)'
		);
		const readResult = (result: unknown): number =>
			typeof result === 'number' ? result : -1;
		return {
			queryActivePaths: () => {
				const pathCount = [0];
				const modeCount = [0];
				assertSuccess(
					'GetDisplayConfigBufferSizes',
					getBufferSizes(
						Win32Constants.queryOnlyActivePaths,
						pathCount,
						modeCount
					)
				);
				const paths = Buffer.alloc((pathCount[0] ?? 0) * PATH_INFO_SIZE);
				const modes = Buffer.alloc((modeCount[0] ?? 0) * MODE_INFO_SIZE);
				assertSuccess(
					'QueryDisplayConfig',
					queryDisplayConfig(
						Win32Constants.queryOnlyActivePaths,
						pathCount,
						paths,
						modeCount,
						modes,
						NO_TOPOLOGY
					)
				);
				return {
					paths,
					pathCount: pathCount[0] ?? 0,
					modes,
					modeCount: modeCount[0] ?? 0,
				};
			},
			getDeviceInfo: (packet) => readResult(getDeviceInfo(packet)),
			setDeviceInfo: (packet) => readResult(setDeviceInfo(packet)),
		};
	}
);
