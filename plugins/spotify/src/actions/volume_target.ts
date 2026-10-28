/** Whose volume a "Volume" dial controls: Spotify, the app in the foreground, or an app picked in the dial settings (none picked yet when `imageName` is `undefined`). */
export type VolumeTarget =
	| Readonly<{ kind: 'spotify' }>
	| Readonly<{ kind: 'focused' }>
	| Readonly<{ kind: 'app'; imageName: string | undefined }>;
