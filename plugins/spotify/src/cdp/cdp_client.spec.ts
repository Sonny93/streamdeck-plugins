import { afterEach, describe, expect, it, vi } from 'vitest';

import { CdpClient } from './cdp_client';
import { CdpConnectionError } from './cdp_connection_error';
import { CdpProtocolError } from './cdp_protocol_error';

const OPEN_READY_STATE = 1;
const CLOSED_READY_STATE = 3;
const FIRST_REQUEST_ID = 1;
const ENDPOINT_URL = 'ws://127.0.0.1:9229/devtools/browser/test';

type Listener = (event: unknown) => void;

class FakeWebSocket {
	static readonly OPEN = OPEN_READY_STATE;
	static latest: FakeWebSocket;

	readyState = OPEN_READY_STATE;
	readonly sentFrames: string[] = [];
	private readonly listeners = new Map<string, Listener[]>();

	constructor(readonly url: string) {
		FakeWebSocket.latest = this;
		queueMicrotask(() => this.emit('open', {}));
	}

	addEventListener(type: string, listener: Listener): void {
		this.listeners.set(type, [...(this.listeners.get(type) ?? []), listener]);
	}

	send(frame: string): void {
		this.sentFrames.push(frame);
	}

	close(): void {
		this.readyState = CLOSED_READY_STATE;
		this.emit('close', {});
	}

	receive(frame: string): void {
		this.emit('message', { data: frame });
	}

	private emit(type: string, event: unknown): void {
		for (const listener of this.listeners.get(type) ?? []) {
			listener(event);
		}
	}
}

async function connectClient(): Promise<{
	client: CdpClient;
	socket: FakeWebSocket;
}> {
	vi.stubGlobal('WebSocket', FakeWebSocket);
	const client = await CdpClient.connect(ENDPOINT_URL);
	return { client, socket: FakeWebSocket.latest };
}

afterEach(() => {
	vi.unstubAllGlobals();
});

describe('CdpClient', () => {
	it('should send the method and params as a JSON frame', async () => {
		const { client, socket } = await connectClient();

		void client
			.send('Runtime.evaluate', { expression: '1' })
			.catch(() => undefined);

		expect(JSON.parse(socket.sentFrames[0] ?? '')).toEqual({
			id: FIRST_REQUEST_ID,
			method: 'Runtime.evaluate',
			params: { expression: '1' },
		});
	});

	it('should resolve with the result when the response matches the request id', async () => {
		const { client, socket } = await connectClient();
		const pending = client.send('Runtime.evaluate');

		socket.receive(
			JSON.stringify({ id: FIRST_REQUEST_ID, result: { value: 1 } })
		);

		await expect(pending).resolves.toEqual({ value: 1 });
	});

	it('should reject with a protocol error when the response carries an error', async () => {
		const { client, socket } = await connectClient();
		const pending = client.send('Browser.getWindowForTarget');

		socket.receive(
			JSON.stringify({
				id: FIRST_REQUEST_ID,
				error: { code: -32000, message: 'No window' },
			})
		);

		await expect(pending).rejects.toThrow(CdpProtocolError);
	});

	it('should keep waiting when an event is received before the response', async () => {
		const { client, socket } = await connectClient();
		const pending = client.send('Runtime.evaluate');

		socket.receive(
			JSON.stringify({ method: 'Target.targetCreated', params: {} })
		);
		socket.receive(JSON.stringify({ id: FIRST_REQUEST_ID, result: 'done' }));

		await expect(pending).resolves.toBe('done');
	});

	it('should notify the listener subscribed to the method when an event is received', async () => {
		const { client, socket } = await connectClient();
		const listener = vi.fn();
		client.on('Runtime.bindingCalled', listener);

		socket.receive(
			JSON.stringify({
				method: 'Runtime.bindingCalled',
				params: { payload: 'x' },
			})
		);

		expect(listener).toHaveBeenCalledWith({ payload: 'x' });
	});

	it('should not notify the listener when another method is received', async () => {
		const { client, socket } = await connectClient();
		const listener = vi.fn();
		client.on('Runtime.bindingCalled', listener);

		socket.receive(
			JSON.stringify({ method: 'Target.targetCreated', params: {} })
		);

		expect(listener).not.toHaveBeenCalled();
	});

	it('should notify the close listener when the websocket closes', async () => {
		const { client, socket } = await connectClient();
		const listener = vi.fn();
		client.onClose(listener);

		socket.close();

		expect(listener).toHaveBeenCalledTimes(1);
	});

	it('should reject pending requests with a connection error when the websocket closes', async () => {
		const { client, socket } = await connectClient();
		const pending = client.send('Runtime.evaluate');

		socket.close();

		await expect(pending).rejects.toThrow(CdpConnectionError);
	});

	it('should reject new requests with a connection error when the websocket is closed', async () => {
		const { client, socket } = await connectClient();
		socket.close();

		await expect(client.send('Runtime.evaluate')).rejects.toThrow(
			CdpConnectionError
		);
	});
});
