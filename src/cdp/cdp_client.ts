import type { CdpMessage } from './cdp_message';
import { parseCdpMessage } from './parse_cdp_message';
import type { CdpConnection } from './cdp_connection';
import { CdpProtocolError } from './cdp_protocol_error';
import { CdpConnectionError } from './cdp_connection_error';
import { CdpMalformedMessageError } from './cdp_malformed_message_error';

type PendingRequest = Readonly<{
	resolve: (result: unknown) => void;
	reject: (reason: unknown) => void;
}>;

type EventListener = (params: unknown) => void;

function readTextFrame(data: unknown): string {
	if (typeof data !== 'string') {
		throw new CdpMalformedMessageError();
	}
	return data;
}

/** Minimal Chrome DevTools Protocol client over a single websocket. */
export class CdpClient implements CdpConnection {
	private readonly pendingRequests = new Map<number, PendingRequest>();
	private readonly eventListeners = new Map<string, EventListener[]>();
	private readonly closeListeners: Array<() => void> = [];
	private nextRequestId = 1;

	private constructor(private readonly socket: WebSocket) {
		socket.addEventListener('message', (event) =>
			this.handleMessage(event.data)
		);
		socket.addEventListener('close', () => this.handleClose());
		socket.addEventListener('error', (event) =>
			this.failAllRequests(
				new CdpConnectionError({ reason: 'the websocket failed', cause: event })
			)
		);
	}

	/** Opens a websocket to the given CDP endpoint and resolves once it is ready. */
	static connect(webSocketUrl: string): Promise<CdpClient> {
		return new Promise((resolve, reject) => {
			const socket = new WebSocket(webSocketUrl);
			socket.addEventListener('open', () => resolve(new CdpClient(socket)), {
				once: true,
			});
			socket.addEventListener(
				'error',
				(event) =>
					reject(
						new CdpConnectionError({
							reason: `cannot open ${webSocketUrl}`,
							cause: event,
						})
					),
				{ once: true }
			);
		});
	}

	/** Sends a CDP command and resolves with its raw `result` payload. */
	send(
		method: string,
		params: Readonly<Record<string, unknown>> = {}
	): Promise<unknown> {
		return new Promise((resolve, reject) => {
			if (this.socket.readyState !== WebSocket.OPEN) {
				reject(new CdpConnectionError({ reason: 'the websocket is not open' }));
				return;
			}
			const id = this.nextRequestId++;
			this.pendingRequests.set(id, { resolve, reject });
			this.socket.send(JSON.stringify({ id, method, params }));
		});
	}

	/** Subscribes to a CDP event, e.g. `Runtime.bindingCalled`. The listener receives the raw `params`. A listener that throws closes the connection. */
	on(method: string, listener: EventListener): void {
		this.eventListeners.set(method, [
			...(this.eventListeners.get(method) ?? []),
			listener,
		]);
	}

	/** Registers a callback invoked once the websocket has closed. */
	onClose(listener: () => void): void {
		this.closeListeners.push(listener);
	}

	/** Closes the websocket. Pending requests are rejected. */
	close(): void {
		this.socket.close();
	}

	private handleClose(): void {
		this.failAllRequests(
			new CdpConnectionError({ reason: 'the websocket was closed' })
		);
		for (const listener of this.closeListeners) {
			listener();
		}
	}

	private handleMessage(data: unknown): void {
		try {
			this.dispatch(parseCdpMessage(readTextFrame(data)));
		} catch (error) {
			this.failAllRequests(error);
			this.close();
		}
	}

	private dispatch(message: CdpMessage): void {
		if (message.kind === 'event') {
			for (const listener of this.eventListeners.get(message.method) ?? []) {
				listener(message.params);
			}
			return;
		}
		const pendingRequest = this.pendingRequests.get(message.id);
		if (pendingRequest === undefined) {
			return;
		}
		this.pendingRequests.delete(message.id);
		if (message.kind === 'error') {
			pendingRequest.reject(
				new CdpProtocolError({
					protocolCode: message.code,
					protocolMessage: message.message,
				})
			);
			return;
		}
		pendingRequest.resolve(message.result);
	}

	private failAllRequests(reason: unknown): void {
		for (const pendingRequest of this.pendingRequests.values()) {
			pendingRequest.reject(reason);
		}
		this.pendingRequests.clear();
	}
}
