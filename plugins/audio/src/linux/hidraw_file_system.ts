/** The two file reads the discovery of the Volt 1 needs, injected so it runs on a fake file system. */
export type HidrawFileSystem = Readonly<{
	readDirectory: (path: string) => Promise<string[]>;
	readFile: (path: string) => Promise<Uint8Array>;
}>;
