import { describe, expect, it } from 'vitest';

import { escapeXml } from './escape_xml';

describe('escapeXml', () => {
	it('should escape the special characters', () => {
		expect(escapeXml(`<a href="x">Tom & 'Jerry'</a>`)).toBe(
			'&lt;a href=&quot;x&quot;&gt;Tom &amp; &apos;Jerry&apos;&lt;/a&gt;'
		);
	});

	it('should leave a plain text unchanged', () => {
		expect(escapeXml('Road trip')).toBe('Road trip');
	});
});
