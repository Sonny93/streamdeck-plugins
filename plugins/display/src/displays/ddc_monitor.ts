import type { VcpReply } from '../windows/vcp_reply';

/** A monitor opened for DDC/CI; its exchanges are slow and must not overlap. */
export type DdcMonitor = Readonly<{
	readCapabilities: () => Promise<string | undefined>;
	readVcp: (code: number) => Promise<VcpReply | undefined>;
	writeVcp: (code: number, value: number) => Promise<boolean>;
	close: () => void;
}>;
