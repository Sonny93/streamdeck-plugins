import { describe, expect, it } from 'vitest';

import { isImageInTasklistOutput } from './is_image_in_tasklist_output';

const IMAGE_NAME = 'Spotify.exe';
const MATCHING_OUTPUT =
	'"Spotify.exe","8272","Console","5","355,840 Ko"\r\n' +
	'"Spotify.exe","9120","Console","5","112,308 Ko"\r\n';
const ENGLISH_INFO_LINE =
	'INFO: No tasks are running which match the specified criteria.\r\n';
const FRENCH_INFO_LINE =
	'INFORMATION : aucune tâche en service ne correspond aux critères spécifiés.\r\n';
const OTHER_IMAGE_OUTPUT = '"chrome.exe","1204","Console","5","212,004 Ko"\r\n';

describe('isImageInTasklistOutput', () => {
	it('should return true when a row lists the image', () => {
		expect(
			isImageInTasklistOutput({
				output: MATCHING_OUTPUT,
				imageName: IMAGE_NAME,
			})
		).toBe(true);
	});

	it('should return false for the English no-match info line', () => {
		expect(
			isImageInTasklistOutput({
				output: ENGLISH_INFO_LINE,
				imageName: IMAGE_NAME,
			})
		).toBe(false);
	});

	it('should return false for the French no-match info line', () => {
		expect(
			isImageInTasklistOutput({
				output: FRENCH_INFO_LINE,
				imageName: IMAGE_NAME,
			})
		).toBe(false);
	});

	it('should return false for empty output', () => {
		expect(isImageInTasklistOutput({ output: '', imageName: IMAGE_NAME })).toBe(
			false
		);
	});

	it('should return false when only another image is listed', () => {
		expect(
			isImageInTasklistOutput({
				output: OTHER_IMAGE_OUTPUT,
				imageName: IMAGE_NAME,
			})
		).toBe(false);
	});

	it('should match the image name case-insensitively', () => {
		expect(
			isImageInTasklistOutput({
				output: MATCHING_OUTPUT,
				imageName: 'spotify.EXE',
			})
		).toBe(true);
	});
});
