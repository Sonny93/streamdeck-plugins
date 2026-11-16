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

	it('should run at most four lookups at the same time', async () => {
		let running = 0;
		let peak = 0;
		const runCommand = vi.fn<CommandRunner>(async () => {
			running += 1;
			peak = Math.max(peak, running);
			await new Promise((resolve) => {
				setImmediate(resolve);
			});
			running -= 1;
			return 'Noto\t/f/a.ttf\n';
		});
		const codePoints = Array.from({ length: 32 }, (_, index) => 0x4e00 + index);

		await createFallbackFontFinder({ runCommand })(codePoints);

		expect(runCommand).toHaveBeenCalledTimes(32);
		expect(peak).toBe(4);
	});
});
