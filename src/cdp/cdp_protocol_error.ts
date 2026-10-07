/** Raised when Chrome DevTools Protocol answers a command with an error payload. */
export class CdpProtocolError extends Error {
	readonly code = 'E_CDP_PROTOCOL';
	override readonly name = 'CdpProtocolError';
	readonly protocolCode: number;

	constructor(
		options: Readonly<{ protocolCode: number; protocolMessage: string }>
	) {
		super(`CDP error ${options.protocolCode}: ${options.protocolMessage}`);
		this.protocolCode = options.protocolCode;
	}
}
