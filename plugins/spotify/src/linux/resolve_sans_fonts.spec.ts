import type { CommandRunner } from 'deck-kit/process/run_command';
import { describe, expect, it, vi } from 'vitest';

import { resolveSansFonts } from './resolve_sans_fonts';

describe('resolveSansFonts', () => {
	it('should return the family with its regular and bold files', async () => {
		const runCommand = vi
			.fn<CommandRunner>()
			.mockResolvedValueOnce('Liberation Sans\t/f/Regular.ttf\n')
			.mockResolvedValueOnce('Liberation Sans\t/f/Bold.ttf\n');

		expect(await resolveSansFonts({ runCommand })).toStrictEqual({
			family: 'Liberation Sans',
			files: ['/f/Regular.ttf', '/f/Bold.ttf'],
		});
	});

	it('should list a file once when bold resolves to the regular file', async () => {
		const runCommand = vi
			.fn<CommandRunner>()
			.mockResolvedValue('Noto Sans\t/f/NotoSans.ttf\n');

		expect((await resolveSansFonts({ runCommand }))?.files).toStrictEqual([
			'/f/NotoSans.ttf',
		]);
	});

	it('should return undefined when fontconfig is missing', async () => {
		const runCommand = vi
			.fn<CommandRunner>()
			.mockRejectedValue(new Error('spawn fc-match ENOENT'));

		expect(await resolveSansFonts({ runCommand })).toBeUndefined();
	});
});
