import { describe, expect, it } from 'vitest';

import type { DisplayInfo } from '../displays/display_info';
import type { DisplaySystem } from '../displays/display_system';
import { parseVcpCapabilities } from '../displays/parse_vcp_capabilities';
import { pickStandbyMode } from '../displays/pick_standby_mode';
import { VcpCode } from '../displays/vcp_code';
import { createFixtureDisplaySystem } from './create_fixture_display_system';
import { readFixture } from './read_fixture';

const ODYSSEY_ID = 'SAME05C-0000000000000';
const RIGHT_IIYAMA_ID = 'IVM6133-0000000000002';
const TOP_IIYAMA_ID = 'IVM6133-0000000000001';

async function displayOf(
	system: DisplaySystem,
	id: string
): Promise<DisplayInfo> {
	const display = (await system.listDisplays()).find(
		(candidate) => candidate.id === id
	);
	if (display === undefined) {
		throw new Error(`no display ${id} in the fixture`);
	}
	return display;
}

function hdrOnJson(): string {
	const configuration = JSON.parse(readFixture('kscreen_doctor.json')) as {
		outputs: Array<{ name: string; hdr?: boolean }>;
	};
	for (const output of configuration.outputs) {
		if (output.name === 'DP-4') {
			output.hdr = true;
		}
	}
	return JSON.stringify(configuration);
}

describe('createLinuxDisplaySystem', () => {
	describe('listing', () => {
		it('should list the monitors with a stable id built from their EDID', async () => {
			const { system } = createFixtureDisplaySystem();

			const displays = await system.listDisplays();

			expect(displays.map((display) => display.id)).toEqual([
				TOP_IIYAMA_ID,
				RIGHT_IIYAMA_ID,
				ODYSSEY_ID,
			]);
			expect(displays.find((display) => display.id === ODYSSEY_ID)).toEqual({
				id: ODYSSEY_ID,
				model: 'Odyssey G95SD',
				manufacturerId: 'SAM',
				productCode: 'E05C',
				portName: 'DP-4',
				bounds: { left: 0, top: 1080, width: 4655, height: 1310 },
				isPrimary: true,
				hdr: { isSupported: true, isEnabled: false },
				platform: { kind: 'linux', connector: 'DP-4', busNumber: 12 },
			});
		});

		it('should run ddcutil detect once while the outputs stay the same', async () => {
			const { system, runner } = createFixtureDisplaySystem();

			await system.listDisplays();
			await system.listDisplays();

			expect(runner.callsStartingWith('ddcutil detect')).toHaveLength(1);
		});

		it('should run ddcutil detect again when the set of outputs changes', async () => {
			const { system, runner } = createFixtureDisplaySystem();
			await system.listDisplays();
			const configuration = JSON.parse(readFixture('kscreen_doctor.json')) as {
				outputs: Array<{ name: string }>;
			};
			configuration.outputs = configuration.outputs.filter(
				(output) => output.name !== 'DP-6'
			);
			runner.answer('kscreen-doctor -j', JSON.stringify(configuration));

			const displays = await system.listDisplays();

			expect(displays).toHaveLength(2);
			expect(runner.callsStartingWith('ddcutil detect')).toHaveLength(2);
		});

		it('should retry a failed ddcutil detect later, not at every poll', async () => {
			const { system, runner, advance } = createFixtureDisplaySystem();
			runner.forget('ddcutil detect --terse');

			await system.listDisplays();
			await system.listDisplays();
			advance(30_000);
			await system.listDisplays();

			expect(runner.callsStartingWith('ddcutil detect')).toHaveLength(2);
		});
	});

	describe('monitor brightness and power', () => {
		it('should read and write the brightness of a KWin-driven monitor through kscreen, never ddcutil', async () => {
			const { system, runner } = createFixtureDisplaySystem();
			runner.answer('kscreen-doctor output.DP-5.brightness.40', '');
			const monitor = system.openDdcMonitor(
				await displayOf(system, RIGHT_IIYAMA_ID)
			);

			const reply = await monitor?.readVcp(VcpCode.brightness);
			const isWritten = await monitor?.writeVcp(VcpCode.brightness, 40);

			expect(reply).toEqual({ current: 100, maximum: 100 });
			expect(isWritten).toBe(true);
			expect(runner.callsStartingWith('ddcutil getvcp 10')).toEqual([]);
			expect(runner.callsStartingWith('ddcutil setvcp 10')).toEqual([]);
			expect(runner.calls).toContain(
				'kscreen-doctor output.DP-5.brightness.40'
			);
		});

		it('should read the power mode of a KWin-driven monitor once while it is on', async () => {
			const { system, runner, advance } = createFixtureDisplaySystem();
			const monitor = system.openDdcMonitor(
				await displayOf(system, RIGHT_IIYAMA_ID)
			);

			await monitor?.readVcp(VcpCode.powerMode);
			advance(10 * 60_000);
			const reply = await monitor?.readVcp(VcpCode.powerMode);

			expect(reply).toEqual({ current: 1, maximum: 0 });
			expect(
				runner.callsStartingWith('ddcutil getvcp D6 --bus 13')
			).toHaveLength(1);
		});

		it('should poll a KWin-driven monitor the plugin put in standby every 15 s until it is on again', async () => {
			const { system, runner, advance } = createFixtureDisplaySystem();
			runner.answer('ddcutil setvcp D6 5 --bus 13', '');
			const monitor = system.openDdcMonitor(
				await displayOf(system, RIGHT_IIYAMA_ID)
			);
			await monitor?.writeVcp(VcpCode.powerMode, 5);

			advance(14_000);
			const stillOff = await monitor?.readVcp(VcpCode.powerMode);
			advance(1_000);
			const awake = await monitor?.readVcp(VcpCode.powerMode);
			advance(60_000);
			await monitor?.readVcp(VcpCode.powerMode);

			expect(stillOff).toEqual({ current: 5, maximum: 0 });
			expect(awake).toEqual({ current: 1, maximum: 0 });
			expect(
				runner.callsStartingWith('ddcutil getvcp D6 --bus 13')
			).toHaveLength(1);
		});

		it('should read and write the brightness of a monitor KWin does not drive with ddcutil', async () => {
			const { system, runner } = createFixtureDisplaySystem();
			runner.answer('ddcutil setvcp 10 30 --bus 12', '');
			const monitor = system.openDdcMonitor(
				await displayOf(system, ODYSSEY_ID)
			);

			const reply = await monitor?.readVcp(VcpCode.brightness);
			await monitor?.writeVcp(VcpCode.brightness, 30);
			const written = await monitor?.readVcp(VcpCode.brightness);

			expect(reply).toEqual({ current: 50, maximum: 100 });
			expect(written).toEqual({ current: 30, maximum: 100 });
			expect(
				runner.callsStartingWith('ddcutil getvcp 10 D6 --bus 12')
			).toHaveLength(1);
		});

		it('should put a monitor in standby with the D6 power mode', async () => {
			const { system, runner } = createFixtureDisplaySystem();
			runner.answer('ddcutil setvcp D6 5 --bus 13', '');
			const monitor = system.openDdcMonitor(
				await displayOf(system, RIGHT_IIYAMA_ID)
			);

			const isWritten = await monitor?.writeVcp(VcpCode.powerMode, 5);

			expect(isWritten).toBe(true);
			expect(runner.calls).toContain('ddcutil setvcp D6 5 --bus 13');
		});

		it('should report a failed write instead of throwing', async () => {
			const { system } = createFixtureDisplaySystem();
			const monitor = system.openDdcMonitor(
				await displayOf(system, RIGHT_IIYAMA_ID)
			);

			expect(await monitor?.writeVcp(VcpCode.powerMode, 5)).toBe(false);
		});

		it('should give the raw capabilities, from which the standby mode is picked', async () => {
			const { system } = createFixtureDisplaySystem();
			const monitor = system.openDdcMonitor(
				await displayOf(system, RIGHT_IIYAMA_ID)
			);

			const capabilities = await monitor?.readCapabilities();

			expect(
				capabilities === undefined
					? undefined
					: pickStandbyMode(parseVcpCapabilities(capabilities))
			).toBe(5);
		});

		it('should not open a monitor that has neither a bus nor a KWin-driven backlight', async () => {
			const { system } = createFixtureDisplaySystem();
			const display = await displayOf(system, ODYSSEY_ID);
			const withoutBus = (connector: string): DisplayInfo => ({
				...display,
				platform: { kind: 'linux', connector, busNumber: undefined },
			});

			expect(system.openDdcMonitor(withoutBus('DP-5'))).toBeDefined();
			expect(system.openDdcMonitor(withoutBus('DP-4'))).toBeUndefined();
		});
	});

	describe('system brightness', () => {
		it('should read the dimming of KWin on an output whose backlight it does not drive', async () => {
			const { system } = createFixtureDisplaySystem();

			expect(
				await system.readSystemBrightness(await displayOf(system, ODYSSEY_ID))
			).toBe(100);
		});

		it('should have none on an output whose backlight KWin drives', async () => {
			const { system } = createFixtureDisplaySystem();

			expect(
				await system.readSystemBrightness(
					await displayOf(system, RIGHT_IIYAMA_ID)
				)
			).toBeUndefined();
		});

		it('should read the SDR brightness in nits as a percentage while HDR is on', async () => {
			const { system } = createFixtureDisplaySystem({
				kscreenJson: hdrOnJson(),
			});

			expect(
				await system.readSystemBrightness(await displayOf(system, ODYSSEY_ID))
			).toBe(16);
		});

		it('should write the dimming through kscreen, and the SDR brightness in nits in HDR', async () => {
			const sdr = createFixtureDisplaySystem();
			sdr.runner.answer('kscreen-doctor output.DP-4.brightness.60', '');
			const hdr = createFixtureDisplaySystem({ kscreenJson: hdrOnJson() });
			hdr.runner.answer('kscreen-doctor output.DP-4.sdr-brightness.640', '');

			const sdrApplied = await sdr.system.writeSystemBrightness(
				await displayOf(sdr.system, ODYSSEY_ID),
				60
			);
			const hdrApplied = await hdr.system.writeSystemBrightness(
				await displayOf(hdr.system, ODYSSEY_ID),
				60
			);

			expect([sdrApplied, hdrApplied]).toEqual([60, 60]);
		});

		it('should refuse to write on an output whose backlight KWin drives', async () => {
			const { system, runner } = createFixtureDisplaySystem();
			const display = await displayOf(system, RIGHT_IIYAMA_ID);

			await expect(
				system.writeSystemBrightness(display, 60)
			).rejects.toMatchObject({ code: 'E_MONITOR_UNAVAILABLE' });
			expect(runner.callsStartingWith('kscreen-doctor output')).toEqual([]);
		});
	});

	describe('HDR and black screen', () => {
		it('should switch the HDR of a monitor that supports it', async () => {
			const { system, runner } = createFixtureDisplaySystem();
			runner.answer('kscreen-doctor output.DP-4.hdr.enable', '');

			await system.writeHdr(await displayOf(system, ODYSSEY_ID), true);

			expect(runner.calls).toContain('kscreen-doctor output.DP-4.hdr.enable');
		});

		it('should refuse the HDR of a monitor that cannot show it, without running anything', async () => {
			const { system, runner } = createFixtureDisplaySystem();
			const display = await displayOf(system, RIGHT_IIYAMA_ID);

			await expect(system.writeHdr(display, true)).rejects.toMatchObject({
				code: 'E_MONITOR_UNAVAILABLE',
			});
			expect(runner.callsStartingWith('kscreen-doctor output')).toEqual([]);
		});

		it('should say it cannot draw a black screen', () => {
			expect(createFixtureDisplaySystem().system.canBlackScreen).toBe(false);
		});
	});
});
