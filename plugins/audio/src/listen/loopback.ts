/** A loaded `module-loopback`, whoever loaded it, followed by its module index. */
export type Loopback = Readonly<{
	moduleIndex: number;
	/** Node name in the `source=` of its argument, `undefined` when the argument names none or names no listed source (`@DEFAULT_SOURCE@`, an index). */
	requestedSourceId: string | undefined;
	/** Node name of the source its capture stream is linked to, `undefined` while it is not linked. */
	linkedSourceId: string | undefined;
	/** Loudest channel of its capture stream, 0 to 1 on the `pactl` percent scale, `undefined` while the stream is missing. */
	captureLevel: number | undefined;
	/** Loudest channel of its playback stream, `undefined` while the stream is missing. */
	playbackLevel: number | undefined;
	/** Loaded by this plugin, recognized by the tag its argument carries. */
	isPluginLoopback: boolean;
}>;
