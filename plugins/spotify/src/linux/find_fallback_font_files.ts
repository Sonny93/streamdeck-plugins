import { runCommand, type CommandRunner } from 'deck-kit/process/run_command';

import { parseFontMatch } from './parse_font_match';

const FONT_MATCH_FORMAT = '%{family}\t%{file}\n';

type FallbackFontFinder = (codePoints: readonly number[]) => Promise<string[]>;

/**
 * Builds the function that asks fontconfig which font file draws each character (`fc-match sans-serif:charset=<hex>`).
 * Answers are kept per character, so a title is looked up once; a character with no answer is left out.
 */
export function createFallbackFontFinder(
	options: Readonly<{ runCommand?: CommandRunner }> = {}
): FallbackFontFinder {
	const run = options.runCommand ?? runCommand;
	const files = new Map<number, Promise<string | undefined>>();

	async function lookUp(codePoint: number): Promise<string | undefined> {
		try {
			const output = await run({
				command: 'fc-match',
				args: [
					'-f',
					FONT_MATCH_FORMAT,
					`sans-serif:charset=${codePoint.toString(16)}`,
				],
			});
			return parseFontMatch(output)?.file;
		} catch {
			return undefined;
		}
	}

	return async (codePoints) => {
		const found = await Promise.all(
			codePoints.map((codePoint) => {
				const known = files.get(codePoint) ?? lookUp(codePoint);
				files.set(codePoint, known);
				return known;
			})
		);
		return [...new Set(found.filter((file) => file !== undefined))];
	};
}
