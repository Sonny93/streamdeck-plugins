import { z } from 'zod';

import type { CdpMessage } from './cdp_message';
import { CdpMalformedMessageError } from './cdp_malformed_message_error';

const cdpEnvelopeSchema = z.object({
	id: z.number().optional(),
	method: z.string().optional(),
	params: z.unknown().optional(),
	result: z.unknown().optional(),
	error: z.object({ code: z.number(), message: z.string() }).optional(),
});

function decodeJson(rawMessage: string): unknown {
	try {
		return JSON.parse(rawMessage);
	} catch (error) {
		throw new CdpMalformedMessageError({ cause: error });
	}
}

/**
 * Decodes a raw CDP websocket frame.
 * Messages without an `id` are events and must carry a `method`.
 */
export function parseCdpMessage(rawMessage: string): CdpMessage {
	const envelope = cdpEnvelopeSchema.safeParse(decodeJson(rawMessage));
	if (!envelope.success) {
		throw new CdpMalformedMessageError({ cause: envelope.error });
	}
	const { id, method, params, result, error } = envelope.data;
	if (id === undefined) {
		if (method === undefined) {
			throw new CdpMalformedMessageError();
		}
		return { kind: 'event', method, params };
	}
	if (error !== undefined) {
		return { kind: 'error', id, code: error.code, message: error.message };
	}
	return { kind: 'result', id, result };
}
