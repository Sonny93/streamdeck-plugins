/** Raised when kdotool, the tool that drives windows on KDE Wayland, is not installed. */
export class KdotoolMissingError extends Error {
	readonly code = 'E_KDOTOOL_MISSING';
	override readonly name = 'KdotoolMissingError';

	constructor(options: Readonly<{ cause: unknown }>) {
		super('Install kdotool (AUR) to raise the Spotify window on KDE Wayland.', {
			cause: options.cause,
		});
	}
}
