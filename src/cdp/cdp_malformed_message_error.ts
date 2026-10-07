/** Raised when a CDP websocket message is not valid JSON or does not match the protocol envelope. */
export class CdpMalformedMessageError extends Error {
	readonly code = 'E_CDP_MALFORMED_MESSAGE';
	override readonly name = 'CdpMalformedMessageError';

	constructor(options: Readonly<{ cause?: unknown }> = {}) {
		super('Received a malformed CDP message.', { cause: options.cause });
	}
}
