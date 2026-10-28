/** Raised when the pack cannot be linked into the icon packs folder of Stream Deck. */
export class IconPackLinkError extends Error {
	readonly code = 'E_ICON_PACK_LINK';
	override readonly name = 'IconPackLinkError';

	constructor(options: Readonly<{ reason: string; cause?: unknown }>) {
		super(`Cannot link the icon pack: ${options.reason}`, {
			cause: options.cause,
		});
	}
}
