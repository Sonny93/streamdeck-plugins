/** What `pactl list clients` tells about a client of the sound server: the binary and the process it runs, when known. */
export type ClientInfo = Readonly<{
	binary: string | undefined;
	processId: number | undefined;
}>;
