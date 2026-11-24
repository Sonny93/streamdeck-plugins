import { describe, expect, it } from 'vitest';

import { createLinuxSourceListening } from './create_linux_source_listening';
import {
	FAKE_MIC,
	FAKE_MIC_INDEX,
	FAKE_VOLT,
	FAKE_VOLT_INDEX,
	buildLoopbackRow,
	createFakeListenSystem,
	instantSchedule,
} from './fake_listen_system';

describe('stopListening', () => {
	it('should unload only the loopbacks of that source and leave the other modules', async () => {
		const system = createFakeListenSystem({
			modules: [
				'1\tlibpipewire-module-rt\t{',
				'            nice.level    = -11',
				'5\tmodule-null-sink\tsink_name=x\t',
				buildLoopbackRow(9, FAKE_MIC),
				buildLoopbackRow(10, FAKE_VOLT),
				buildLoopbackRow(11, FAKE_MIC),
			],
		});
		const listening = createLinuxSourceListening({
			runCommand: system.runCommand,
			schedule: instantSchedule,
		});

		await listening.stopListening(FAKE_MIC);

		expect(system.writes()).toEqual([
			['unload-module', '9'],
			['unload-module', '11'],
		]);
	});

	it('should unload the loopback whose stream is linked to the source even when its argument names another', async () => {
		const system = createFakeListenSystem({
			modules: [buildLoopbackRow(9, 'other.source')],
			captureStreams: [
				{ ownerModule: 9, sourceIndex: FAKE_MIC_INDEX, levels: [1, 1] },
			],
		});
		const listening = createLinuxSourceListening({
			runCommand: system.runCommand,
			schedule: instantSchedule,
		});

		await listening.stopListening(FAKE_MIC);

		expect(system.writes()).toEqual([['unload-module', '9']]);
	});

	it('should unload a loopback that asks for the source even when its capture stream is linked to another one', async () => {
		const system = createFakeListenSystem({
			modules: [
				buildLoopbackRow(9, FAKE_MIC),
				buildLoopbackRow(10, FAKE_VOLT),
				'5\tmodule-null-sink\tsink_name=x\t',
			],
			captureStreams: [
				{ ownerModule: 9, sourceIndex: FAKE_VOLT_INDEX, levels: [1, 1] },
			],
		});
		const listening = createLinuxSourceListening({
			runCommand: system.runCommand,
			schedule: instantSchedule,
		});

		await listening.stopListening(FAKE_MIC);

		expect(system.writes()).toEqual([['unload-module', '9']]);
	});

	it('should unload nothing when the source has no loopback', async () => {
		const system = createFakeListenSystem();
		const listening = createLinuxSourceListening({
			runCommand: system.runCommand,
			schedule: instantSchedule,
		});

		await listening.stopListening(FAKE_MIC);

		expect(system.writes()).toEqual([]);
	});
});
