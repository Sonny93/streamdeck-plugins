import type { Scheduler } from 'deck-kit/async/scheduler';

type ScheduledTask = {
	readonly callback: () => void;
	readonly dueAt: number;
	readonly order: number;
	isCancelled: boolean;
};

export type FakeScheduler = Readonly<{
	schedule: Scheduler;
	/** Moves the clock forward, running the tasks that fall due in order and letting their promises settle. */
	advance: (milliseconds: number) => Promise<void>;
	/** Lets the pending promises settle without moving the clock. */
	settle: () => Promise<void>;
	pendingCount: () => number;
	/** The virtual time, in milliseconds since the start. */
	now: () => number;
}>;

function settle(): Promise<void> {
	return new Promise((resolve) => {
		setImmediate(resolve);
	});
}

/** A scheduler on a virtual clock, to drive timers in tests without waiting. */
export function createFakeScheduler(): FakeScheduler {
	let now = 0;
	let counter = 0;
	const tasks: ScheduledTask[] = [];

	const schedule: Scheduler = (callback, delayMilliseconds) => {
		counter += 1;
		const task: ScheduledTask = {
			callback,
			dueAt: now + delayMilliseconds,
			order: counter,
			isCancelled: false,
		};
		tasks.push(task);
		return () => {
			task.isCancelled = true;
		};
	};

	function takeNextDue(until: number): ScheduledTask | undefined {
		const due = tasks
			.filter((task) => !task.isCancelled && task.dueAt <= until)
			.toSorted(
				(first, second) =>
					first.dueAt - second.dueAt || first.order - second.order
			)[0];
		if (due !== undefined) {
			tasks.splice(tasks.indexOf(due), 1);
		}
		return due;
	}

	async function runDueTasks(until: number): Promise<void> {
		const task = takeNextDue(until);
		if (task === undefined) {
			return;
		}
		now = Math.max(now, task.dueAt);
		task.callback();
		await settle();
		await runDueTasks(until);
	}

	async function advance(milliseconds: number): Promise<void> {
		const target = now + milliseconds;
		await runDueTasks(target);
		now = target;
		await settle();
	}

	return {
		schedule,
		advance,
		settle,
		now: () => now,
		pendingCount: () => tasks.filter((task) => !task.isCancelled).length,
	};
}
