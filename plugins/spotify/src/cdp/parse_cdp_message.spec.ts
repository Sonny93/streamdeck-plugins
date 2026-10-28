import { describe, expect, it } from 'vitest';

import { CdpMalformedMessageError } from './cdp_malformed_message_error';
import { parseCdpMessage } from './parse_cdp_message';

function buildResultFrame(id: number, result: unknown): string {
	return JSON.stringify({ id, result });
}

function buildErrorFrame(id: number, code: number, message: string): string {
	return JSON.stringify({ id, error: { code, message } });
}

function buildEventFrame(method: string): string {
	return JSON.stringify({ method, params: {} });
}

describe('parseCdpMessage', () => {
	it('should return a result message when the frame has an id and a result', () => {
		expect(parseCdpMessage(buildResultFrame(3, { value: 'ok' }))).toEqual({
			kind: 'result',
			id: 3,
			result: { value: 'ok' },
		});
	});

	it('should return an error message when the frame has an id and an error', () => {
		expect(parseCdpMessage(buildErrorFrame(4, -32000, 'No window'))).toEqual({
			kind: 'error',
			id: 4,
			code: -32000,
			message: 'No window',
		});
	});

	it('should return an event message with its method and params when the frame has no id', () => {
		expect(parseCdpMessage(buildEventFrame('Target.targetCreated'))).toEqual({
			kind: 'event',
			method: 'Target.targetCreated',
			params: {},
		});
	});

	it('should throw a malformed message error when the frame has neither id nor method', () => {
		expect(() => parseCdpMessage(JSON.stringify({ params: {} }))).toThrow(
			CdpMalformedMessageError
		);
	});

	it('should throw a malformed message error when the frame is not valid JSON', () => {
		expect(() => parseCdpMessage('{nope')).toThrow(CdpMalformedMessageError);
	});

	it('should throw a malformed message error when the id is not a number', () => {
		expect(() =>
			parseCdpMessage(JSON.stringify({ id: 'one', result: {} }))
		).toThrow(CdpMalformedMessageError);
	});
});
