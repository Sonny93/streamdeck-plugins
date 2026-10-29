import type koffiModule from 'koffi';

import { NativeCallError } from './native_call_error';

type NativeFunction = ReturnType<
	ReturnType<(typeof koffiModule)['load']>['func']
>;

/** Runs a native function on a koffi worker thread, so a slow call (DDC/CI takes tens of milliseconds) does not freeze the plugin. */
export function callOnWorker(
	nativeFunction: NativeFunction,
	...args: unknown[]
): Promise<unknown> {
	return new Promise((resolve, reject) => {
		nativeFunction.async(...args, (error: unknown, result: unknown) => {
			if (error === null || error === undefined) {
				resolve(result);
				return;
			}
			reject(new NativeCallError({ cause: error }));
		});
	});
}
