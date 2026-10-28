/** A decoded CDP websocket message: a command result, a command error, or a protocol event. */
export type CdpMessage =
	| Readonly<{ kind: 'result'; id: number; result: unknown }>
	| Readonly<{ kind: 'error'; id: number; code: number; message: string }>
	| Readonly<{ kind: 'event'; method: string; params: unknown }>;
