/** One audio session of an output device, as the Windows volume mixer lists it; `imagePath` is `undefined` for the system sounds or a process that cannot be inspected. */
export type AudioSessionSnapshot = Readonly<{
	processId: number;
	imagePath: string | undefined;
	volume: number;
	isMuted: boolean;
}>;
