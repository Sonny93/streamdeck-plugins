import type { FileHandle } from './file_handle';

/** The subset of the Win32 kernel32 API needed to talk to a HID collection; reads and writes run on the koffi worker threads. */
export type Kernel32 = Readonly<{
	/** Opens a device path, `undefined` when Windows refuses it (the reason is in `getLastError`). */
	createFile: (path: string, access: number) => FileHandle | undefined;
	/** Waits for the next input report and resolves with its length, `undefined` when the read fails (device unplugged). */
	readFile: (
		handle: FileHandle,
		buffer: Uint8Array
	) => Promise<number | undefined>;
	/** Sends a whole output report and tells whether every byte was written. */
	writeFile: (handle: FileHandle, buffer: Uint8Array) => Promise<boolean>;
	closeHandle: (handle: FileHandle) => void;
	getLastError: () => number;
}>;
