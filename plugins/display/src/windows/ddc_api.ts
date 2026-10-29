import type { NativePointer } from 'deck-kit/windows/native_pointer';

import type { VcpReply } from './vcp_reply';

/** The DDC/CI functions of dxva2, which talk to the monitor over its cable; every exchange runs on a koffi worker thread. */
export type DdcApi = Readonly<{
	/** Opens the physical monitor shown in a screen rectangle (physical pixels), `undefined` when it has none. */
	openPhysicalMonitor: (
		rect: Readonly<{ left: number; top: number; right: number; bottom: number }>
	) => NativePointer | undefined;
	closePhysicalMonitor: (handle: NativePointer) => void;
	readCapabilities: (handle: NativePointer) => Promise<string | undefined>;
	readVcp: (
		handle: NativePointer,
		code: number
	) => Promise<VcpReply | undefined>;
	writeVcp: (
		handle: NativePointer,
		code: number,
		value: number
	) => Promise<boolean>;
}>;
