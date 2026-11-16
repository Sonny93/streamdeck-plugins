import { open } from 'node:fs/promises';

import type { HidrawHandle } from './hidraw_handle';

/** Opens a hidraw node for reading and writing; a read holds one thread of the libuv pool until a report arrives. */
export async function openHidrawHandle(path: string): Promise<HidrawHandle> {
	const handle = await open(path, 'r+');
	return {
		read: async (buffer) =>
			(await handle.read(buffer, 0, buffer.length, null)).bytesRead,
		write: async (report) =>
			(await handle.write(report, 0, report.length, null)).bytesWritten,
		close: () => handle.close(),
	};
}
