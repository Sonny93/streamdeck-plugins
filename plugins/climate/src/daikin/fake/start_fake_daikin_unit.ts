import {
	createServer,
	type IncomingHttpHeaders,
	type IncomingMessage,
	type Server,
	type ServerResponse,
} from 'node:http';

import type { RawRecord } from '../raw_record';
import {
	createFakeRequestGate,
	type FakeRequestFailure,
	type FakeRequestGate,
} from './fake_request_gate';
import {
	createFakeUnitModel,
	type FakeUnitModel,
	type FakeUnitOptions,
} from './fake_unit_model';

const LOOPBACK = '127.0.0.1';

export type FakeDaikinUnit = {
	/** `127.0.0.1:<port>`, usable as the driver `host`. */
	readonly host: string;
	/** Requests hang (never answered) while false. */
	readonly setReachable: (isReachable: boolean) => void;
	/** Simulates the remote or the app changing the raw control info. */
	readonly applyRemoteChange: (change: RawRecord) => void;
	readonly setSensors: (change: RawRecord) => void;
	/**
	 * Makes a request on `path` hang or drop the connection, after letting `skipCount`
	 * matching requests through. The SET params are recorded but never applied.
	 */
	readonly failNextRequest: (
		path: string,
		failure: FakeRequestFailure,
		skipCount?: number
	) => void;
	readonly readRawControl: () => RawRecord;
	/** Params of every SET (control info or special mode) received, in order, applied or not. */
	readonly receivedCommands: () => readonly RawRecord[];
	/** Headers of every request received, in order, as sent by the client. */
	readonly receivedRequestHeaders: () => readonly IncomingHttpHeaders[];
	readonly close: () => Promise<void>;
};

function handleRequest(
	model: FakeUnitModel,
	gate: FakeRequestGate,
	request: IncomingMessage,
	response: ServerResponse
): void {
	if (!gate.isReachable()) return;
	const url = new URL(request.url ?? '/', `http://${LOOPBACK}`);
	const query = Object.fromEntries(url.searchParams);
	model.recordCommand(url.pathname, query);
	const failure = gate.takeFailure(url.pathname);
	if (failure === 'hang') return;
	if (failure === 'drop') {
		request.socket.destroy();
		return;
	}
	const reply = model.reply(url.pathname, query);
	response.writeHead(reply.status, { 'content-type': 'text/plain' });
	response.end(reply.body);
}

function listen(server: Server): Promise<number> {
	return new Promise((resolve, reject) => {
		server.once('error', reject);
		server.listen(0, LOOPBACK, () => {
			const address = server.address();
			if (address === null || typeof address === 'string') {
				reject(new Error('Fake unit server has no TCP address'));
				return;
			}
			resolve(address.port);
		});
	});
}

function closeServer(server: Server): Promise<void> {
	server.closeAllConnections();
	return new Promise((resolve) => server.close(() => resolve()));
}

/**
 * HTTP fake of a Daikin wifi module on 127.0.0.1 with an ephemeral port.
 * Defaults reproduce the fake unit. `kind: 'cloud-only'` answers 404 everywhere.
 */
export async function startFakeDaikinUnit(
	options: Readonly<FakeUnitOptions> = {}
): Promise<FakeDaikinUnit> {
	const model = createFakeUnitModel(options);
	const gate = createFakeRequestGate();
	let requestHeaders: readonly IncomingHttpHeaders[] = [];
	const server = createServer((request, response) => {
		requestHeaders = [...requestHeaders, request.headers];
		handleRequest(model, gate, request, response);
	});
	const port = await listen(server);
	return {
		host: `${LOOPBACK}:${port}`,
		setReachable: gate.setReachable,
		applyRemoteChange: model.applyRemoteChange,
		setSensors: model.setSensors,
		failNextRequest: (path, failure, skipCount = 0) =>
			gate.planFailure(path, failure, skipCount),
		readRawControl: model.readControl,
		receivedCommands: model.readCommands,
		receivedRequestHeaders: () => requestHeaders,
		close: () => closeServer(server),
	};
}
