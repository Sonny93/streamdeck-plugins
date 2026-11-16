import { describe, expect, it } from 'vitest';

import { buildPactlSubscribeCommand } from './build_pactl_subscribe_command';

describe('buildPactlSubscribeCommand', () => {
	it('should run pactl under setpriv so it dies with its parent', () => {
		expect(buildPactlSubscribeCommand(true)).toEqual({
			command: 'setpriv',
			args: ['--pdeathsig', 'TERM', '--', 'pactl', 'subscribe'],
		});
	});

	it('should run pactl alone when setpriv is not wanted', () => {
		expect(buildPactlSubscribeCommand(false)).toEqual({
			command: 'pactl',
			args: ['subscribe'],
		});
	});
});
