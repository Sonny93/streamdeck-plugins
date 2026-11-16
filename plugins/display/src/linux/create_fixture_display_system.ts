import type { DisplaySystem } from '../displays/display_system';
import { createLinuxDisplaySystem } from './create_linux_display_system';
import { FakeCommandRunner } from './fake_command_runner';
import { readEdidFixture, readFixture } from './read_fixture';

const EDID_FIXTURES: Readonly<Record<string, string>> = {
	'DP-4': 'edid_odyssey.hex',
	'DP-5': 'edid_iiyama_a.hex',
	'DP-6': 'edid_iiyama_b.hex',
};

/**
 * A Linux display system fed with the captures of the real machine: DP-4 is an Odyssey whose DDC/CI KWin does not drive,
 * DP-5 and DP-6 are two iiyama monitors KWin drives. It never touches the machine: every command goes to the fake runner.
 */
export function createFixtureDisplaySystem(
	options: Readonly<{ kscreenJson?: string }> = {}
): Readonly<{
	system: DisplaySystem;
	runner: FakeCommandRunner;
	advance: (milliseconds: number) => void;
}> {
	const runner = new FakeCommandRunner(
		new Map([
			[
				'kscreen-doctor -j',
				options.kscreenJson ?? readFixture('kscreen_doctor.json'),
			],
			['ddcutil detect --terse', readFixture('ddcutil_detect_terse.txt')],
			[
				'ddcutil getvcp 10 D6 --bus 12 --brief --skip-ddc-checks',
				readFixture('ddcutil_getvcp_odyssey.txt'),
			],
			[
				'ddcutil getvcp D6 --bus 13 --brief --skip-ddc-checks',
				'VCP D6 SNC x01\n',
			],
			[
				'ddcutil getvcp D6 --bus 14 --brief --skip-ddc-checks',
				'VCP D6 SNC x01\n',
			],
			[
				'ddcutil capabilities --bus 13 --verbose',
				readFixture('ddcutil_capabilities_verbose_iiyama.txt'),
			],
			[
				'ddcutil capabilities --bus 12 --verbose',
				readFixture('ddcutil_capabilities_verbose_odyssey.txt'),
			],
		])
	);
	let time = 0;
	const system = createLinuxDisplaySystem({
		runCommand: runner.runCommand,
		readEdid: (connector) => {
			const fixture = EDID_FIXTURES[connector];
			return Promise.resolve(
				fixture === undefined ? undefined : readEdidFixture(fixture)
			);
		},
		now: () => time,
	});
	return {
		system,
		runner,
		advance: (milliseconds) => {
			time += milliseconds;
		},
	};
}
