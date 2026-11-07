import { describe, expect, it } from 'vitest';

import { isImageListed } from './is_image_listed';

const IMAGE_NAME = 'ElgatoAudioControlServer.exe';

describe('isImageListed', () => {
	it('should match the image name in a csv row', () => {
		const output =
			'"ElgatoAudioControlServer.exe","4321","Console","1","52,340 K"\r\n';

		expect(isImageListed(output, IMAGE_NAME)).toBe(true);
	});

	it('should match whatever the case of the image name', () => {
		const output =
			'"elgatoaudiocontrolserver.exe","4321","Console","1","52,340 K"';

		expect(isImageListed(output, IMAGE_NAME)).toBe(true);
	});

	it('should not match the INFO line printed when nothing matches', () => {
		const output =
			'INFO: No tasks are running which match the specified criteria.\r\n';

		expect(isImageListed(output, IMAGE_NAME)).toBe(false);
	});

	it('should not match a localized INFO line that quotes the image name', () => {
		const output = `INFO: "${IMAGE_NAME}" introuvable.\r\n`;

		expect(isImageListed(output, IMAGE_NAME)).toBe(false);
	});

	it('should not match other image names', () => {
		const output =
			'"ElgatoAudioControlServer2.exe","1","Console","1","1 K"\r\n"Other.exe","2","Console","1","2 K"\r\n';

		expect(isImageListed(output, IMAGE_NAME)).toBe(false);
	});

	it('should match a row among several', () => {
		const output = `"Other.exe","2","Console","1","2 K"\r\n"${IMAGE_NAME}","9","Console","1","3 K"\r\n`;

		expect(isImageListed(output, IMAGE_NAME)).toBe(true);
	});
});
