/** The part of a CDP client that Spotify commands rely on. */
export type CdpConnection = Readonly<{
	send: (
		method: string,
		params?: Readonly<Record<string, unknown>>
	) => Promise<unknown>;
	close: () => void;
}>;
