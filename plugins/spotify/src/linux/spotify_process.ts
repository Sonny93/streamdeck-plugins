/** A running Spotify process and the process that started it. */
export type SpotifyProcess = Readonly<{
	processId: number;
	parentId: number;
}>;
