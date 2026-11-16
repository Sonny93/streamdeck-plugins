/** What a running `pactl subscribe` reports: each line it prints, and its end, whatever the cause. */
export type SpawnPactlSubscribeOptions = Readonly<{
	onLine: (line: string) => void;
	onExit: () => void;
}>;
