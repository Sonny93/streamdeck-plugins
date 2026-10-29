import { describe, expect, it } from 'vitest';

import { buildMonitorSnapshotForTest } from '../../displays/build_monitor_snapshot_for_test';
import { listMonitorChoices } from './list_monitor_choices';

const SNAPSHOT = {
	monitors: [buildMonitorSnapshotForTest({ id: 'top', name: 'PL2530H (top)' })],
};

describe('listMonitorChoices', () => {
	it('offers the main monitor, every monitor when the action can, then each lit one', () => {
		expect(
			listMonitorChoices({
				snapshot: SNAPSHOT,
				offersAll: true,
				pickedValue: 'top',
			})
		).toEqual([
			{ label: 'Main monitor', value: 'primary' },
			{ label: 'All monitors', value: 'all' },
			{ label: 'PL2530H (top)', value: 'top' },
		]);
	});

	it('keeps showing a picked monitor that is not lit', () => {
		const choices = listMonitorChoices({
			snapshot: SNAPSHOT,
			offersAll: false,
			pickedValue: 'gone',
		});

		expect(choices.map((choice) => choice.value)).toEqual([
			'primary',
			'top',
			'gone',
		]);
	});
});
