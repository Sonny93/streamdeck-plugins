import { describe, expect, it } from 'vitest';

import { UnitProtocolError } from '../errors/unit_protocol_error';
import { parseResponse } from './parse_response';

describe('parseResponse', () => {
	it('should decode URL-encoded values when parsing a response', () => {
		const record = parseResponse('ret=OK,name=%54%65%73%74,icon=0');

		expect(record).toEqual({ ret: 'OK', name: 'Test', icon: '0' });
	});

	it('should decode multi-byte UTF-8 when the name has accents', () => {
		const record = parseResponse('ret=OK,name=%54%65%73%74%20%c3%a9');

		expect(record['name']).toBe('Test é');
	});

	it('should keep absent markers and empty values as is when parsing', () => {
		const record = parseResponse('ret=OK,hhum=-,ac_dst=--,pw=,adv=');

		expect(record).toMatchObject({ hhum: '-', ac_dst: '--', pw: '', adv: '' });
	});

	it('should keep the part after the first equals sign when a value contains one', () => {
		expect(parseResponse('ret=OK,k=a=b')['k']).toBe('a=b');
	});

	it('should throw a protocol error when a value has an invalid URL-encoding', () => {
		expect(() => parseResponse('ret=OK,name=%ZZ')).toThrow(UnitProtocolError);
	});

	it('should throw a protocol error when an entry has no equals sign', () => {
		expect(() => parseResponse('ret=OK,garbage')).toThrow(UnitProtocolError);
	});

	it('should throw a protocol error when the body has no ret key', () => {
		expect(() => parseResponse('Page Not Found')).toThrow(UnitProtocolError);
	});
});
