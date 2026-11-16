/** The part of /proc the Spotify process scan reads, so tests can replace it. */
export type ProcFileSystem = Readonly<{
	listProcessIds: () => Promise<readonly number[]>;
	readProcessFile: (
		processId: number,
		fileName: 'comm' | 'stat'
	) => Promise<string | undefined>;
	readProcessExecutable: (processId: number) => Promise<string | undefined>;
}>;
