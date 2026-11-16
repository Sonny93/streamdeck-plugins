import { request as httpRequest, type IncomingMessage } from 'node:http';

import { UnitProtocolError } from '../errors/unit_protocol_error';
import { UnitRejectedError } from '../errors/unit_rejected_error';
import { UnitUnreachableError } from '../errors/unit_unreachable_error';
import { parseResponse } from '../protocol/parse_response';
import type { RawRecord } from '../raw_record';
import type { UnitRequester } from './unit_requester';

const NEVER_CONNECTED_CODES: readonly string[] = [
	'ECONNREFUSED',
	'ENOTFOUND',
	'EHOSTUNREACH',
	'ENETUNREACH',
];

function readErrorCode(error: unknown): string | undefined {
	if (!(error instanceof Error)) return undefined;
	if ('code' in error && typeof error.code === 'string') return error.code;
	return readErrorCode(error.cause);
}

function hasNeverConnected(error: unknown): boolean {
	const code = readErrorCode(error);
	return code !== undefined && NEVER_CONNECTED_CODES.includes(code);
}

const MAX_BODY_BYTES = 16 * 1024;

function buildUrl(
	host: string,
	path: string,
	query: RawRecord | undefined
): URL {
	const queryString =
		query === undefined ? '' : `?${new URLSearchParams(query).toString()}`;
	const url = new URL(`http://${host}${path}${queryString}`);
	if (url.host !== host) {
		throw new UnitProtocolError(`"${host}" is not a plain unit host`);
	}
	return url;
}

async function readCappedBody(response: IncomingMessage): Promise<string> {
	const chunks: Buffer[] = [];
	let receivedBytes = 0;
	for await (const chunk of response) {
		const buffer = Buffer.from(chunk);
		receivedBytes += buffer.byteLength;
		if (receivedBytes > MAX_BODY_BYTES) {
			response.destroy();
			throw new UnitProtocolError(
				`response larger than ${MAX_BODY_BYTES} bytes`
			);
		}
		chunks.push(buffer);
	}
	return Buffer.concat(chunks).toString('utf8');
}

type RawReply = { readonly status: number; readonly body: string };

function sendGet(url: URL, signal: AbortSignal): Promise<RawReply> {
	return new Promise((resolve, reject) => {
		const request = httpRequest(
			url,
			{ agent: false, signal, headers: { accept: '*/*' } },
			(response) => {
				readCappedBody(response).then(
					(body) => resolve({ status: response.statusCode ?? 0, body }),
					reject
				);
			}
		);
		request.on('error', reject);
		request.end();
	});
}

async function fetchBody(
	host: string,
	url: URL,
	timeoutMs: number
): Promise<RawReply> {
	try {
		return await sendGet(url, AbortSignal.timeout(timeoutMs));
	} catch (cause) {
		if (cause instanceof UnitProtocolError) throw cause;
		throw new UnitUnreachableError(host, {
			mayHaveReachedUnit: !hasNeverConnected(cause),
			cause,
		});
	}
}

/** One GET per call. Throws unreachable, protocol or rejected errors; never retries. */
export function createUnitRequester(
	host: string,
	timeoutMs: number
): UnitRequester {
	return async (path, query) => {
		const { status, body } = await fetchBody(
			host,
			buildUrl(host, path, query),
			timeoutMs
		);
		if (status !== 200) {
			throw new UnitProtocolError(`${path} answered HTTP ${status}`);
		}
		const record = parseResponse(body);
		const ret = record['ret'];
		if (ret !== 'OK') throw new UnitRejectedError(ret ?? '');
		return record;
	};
}
