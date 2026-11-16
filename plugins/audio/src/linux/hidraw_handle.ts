/** An open `/dev/hidrawN` node: each call moves whole reports, and the byte counts are what the kernel moved. */
export type HidrawHandle = Readonly<{
	/** Blocks until the next report, fills the buffer with it and resolves with its length. */
	read: (buffer: Uint8Array) => Promise<number>;
	/** Resolves with the number of bytes the kernel accepted. */
	write: (report: Uint8Array) => Promise<number>;
	close: () => Promise<void>;
}>;
