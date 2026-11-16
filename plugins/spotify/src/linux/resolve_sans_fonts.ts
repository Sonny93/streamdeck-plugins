import { runCommand, type CommandRunner } from 'deck-kit/process/run_command';

import { parseFontMatch } from './parse_font_match';

const FONT_MATCH_FORMAT = '%{family}\t%{file}\n';
const REGULAR_PATTERN = 'Arial';
const BOLD_PATTERN = 'Arial:bold';

/** The sans-serif face the frames ask for (Arial, in practice its metric-compatible stand-in), as its family name and its regular and bold files. */
export type SansFonts = Readonly<{ family: string; files: readonly string[] }>;

async function matchFont(
	run: CommandRunner,
	pattern: string
): Promise<ReturnType<typeof parseFontMatch>> {
	return parseFontMatch(
		await run({ command: 'fc-match', args: ['-f', FONT_MATCH_FORMAT, pattern] })
	);
}

/** Asks fontconfig which files serve Arial; `undefined` when fontconfig is missing or knows no font. */
export async function resolveSansFonts(
	options: Readonly<{ runCommand?: CommandRunner }> = {}
): Promise<SansFonts | undefined> {
	const run = options.runCommand ?? runCommand;
	try {
		const regular = await matchFont(run, REGULAR_PATTERN);
		const bold = await matchFont(run, BOLD_PATTERN);
		if (regular === undefined) {
			return undefined;
		}
		const files = [...new Set([regular.file, bold?.file ?? regular.file])];
		return { family: regular.family, files };
	} catch {
		return undefined;
	}
}
