import type { CommandRunner } from 'deck-kit/process/run_command';
import { describe, expect, it, vi } from 'vitest';

import { createFallbackFontFinder } from './find_fallback_font_files';

describe('createFallbackFontFinder', () => {
	it('should return the distinct font files of the characters', async () => {
		const runCommand = vi
			.fn<CommandRunner>()
			.mockResolvedValue('Noto Sans CJK KR\t/f/cjk.ttc\n');

		expect(
			await createFallbackFontFinder({ runCommand })([0x591c, 0x306b])
		).toStrictEqual(['/f/cjk.ttc']);
	});

	it('should ask fontconfig for the character in hexadecimal', async () => {
		const runCommand = vi.fn<CommandRunner>().mockResolvedValue('');

		await createFallbackFontFinder({ runCommand })([0x1f389]);

		expect(runCommand).toHaveBeenCalledWith({
			command: 'fc-match',
			args: ['-f', '%{family}\t%{file}\n', 'sans-serif:charset=1f389'],
		});
	});

	it('should look a character up once', async () => {
		const runCommand = vi
			.fn<CommandRunner>()
			.mockResolvedValue('Noto\t/f/a.ttf\n');
		const find = createFallbackFontFinder({ runCommand });

		await find([0x591c]);
		await find([0x591c]);

		expect(runCommand).toHaveBeenCalledOnce();
	});

	it('should leave out a character fontconfig cannot answer for', async () => {
		const runCommand = vi
			.fn<CommandRunner>()
			.mockRejectedValue(new Error('missing'));

		expect(
			await createFallbackFontFinder({ runCommand })([0x591c])
		).toStrictEqual([]);
	});
});
