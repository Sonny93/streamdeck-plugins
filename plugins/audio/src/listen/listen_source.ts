/** A hardware input that can be listened to, with what the safety checks of listening need. */
export type ListenSource = Readonly<{
	/** The PipeWire node name, as `pactl` lists it. */
	id: string;
	name: string;
	/** Level of the loudest channel, 0 to 1 on the `pactl` percent scale (100 % is 1). */
	loudestLevel: number;
	isMuted: boolean;
	/** Name of the active port (`analog-input-rear-mic`), `undefined` when the source has none. */
	activePort: string | undefined;
}>;
