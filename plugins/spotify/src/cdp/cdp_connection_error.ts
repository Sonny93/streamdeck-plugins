/** Raised when a CDP websocket cannot be opened or closes while requests are pending. */
export class CdpConnectionError extends Error {
	readonly code = 'E_CDP_CONNECTION';
	override readonly name = 'CdpConnectionError';

	constructor(options: Readonly<{ reason: string; cause?: unknown }>) {
		super(`CDP connection failed: ${options.reason}`, { cause: options.cause });
	}
}
