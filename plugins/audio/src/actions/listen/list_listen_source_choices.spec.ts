import { describe, expect, it } from 'vitest';

import {
	buildListenSource,
	REAR_MIC_ID,
} from '../../listen/build_listen_source';
import { listListenSourceChoices } from './list_listen_source_choices';

const LINE_IN = buildListenSource({
	id: 'alsa_input.line_in',
	name: 'Line In',
});

describe('listListenSourceChoices', () => {
	it('should list the hardware inputs it is given and no default choice', () => {
		expect(
			listListenSourceChoices({
				language: 'en',
				sources: [buildListenSource(), LINE_IN],
				pickedValue: undefined,
			})
		).toEqual([
			{ label: 'Rear Mic', value: REAR_MIC_ID },
			{ label: 'Line In', value: 'alsa_input.line_in' },
		]);
	});

	it.each([
		['en', 'Unplugged device'],
		['fr', 'Périphérique débranché'],
	] as const)(
		'should keep listing the picked input first in %s while it is unplugged',
		(language, label) => {
			const choices = listListenSourceChoices({
				language,
				sources: [LINE_IN],
				pickedValue: REAR_MIC_ID,
			});

			expect(choices).toEqual([
				{ label, value: REAR_MIC_ID },
				{ label: 'Line In', value: 'alsa_input.line_in' },
			]);
		}
	);
});
