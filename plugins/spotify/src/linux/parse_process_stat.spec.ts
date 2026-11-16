import { describe, expect, it } from 'vitest';

import { parseProcessStat } from './parse_process_stat';

const ZSH_STAT =
	'62088 (zsh) S 8419 62088 62088 0 -1 4194304 928 3083 0 0 0 0 0 0 16 -4 1 0 219360';
const PARENTHESIZED_COMMAND_STAT =
	'1106 ((sd-pam)) S 1104 1104 1104 0 -1 4194624 65 0 0 0 0 0 0 0 20 0 1 0 2097';
const SPACED_COMMAND_STAT = '4242 (Web Content) S 777 4242 4242 0 -1 4194560 1';

describe('parseProcessStat', () => {
	it('should read the parent process id', () => {
		expect(parseProcessStat(ZSH_STAT)).toBe(8419);
	});

	it('should read the parent id of a command wrapped in parentheses', () => {
		expect(parseProcessStat(PARENTHESIZED_COMMAND_STAT)).toBe(1104);
	});

	it('should read the parent id of a command holding spaces', () => {
		expect(parseProcessStat(SPACED_COMMAND_STAT)).toBe(777);
	});

	it('should return undefined when the content has no command name', () => {
		expect(parseProcessStat('garbage')).toBeUndefined();
	});

	it('should return undefined when no parent id follows the command', () => {
		expect(parseProcessStat('1 (init) S')).toBeUndefined();
	});
});
