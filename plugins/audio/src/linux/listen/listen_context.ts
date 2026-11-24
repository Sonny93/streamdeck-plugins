import type { Scheduler } from 'deck-kit/async/scheduler';
import type { CommandRunner } from 'deck-kit/process/run_command';

/** What the operations of listening run with: the `pactl` runner and the scheduler of its pauses. */
export type ListenContext = Readonly<{
	run: CommandRunner;
	schedule: Scheduler;
}>;
