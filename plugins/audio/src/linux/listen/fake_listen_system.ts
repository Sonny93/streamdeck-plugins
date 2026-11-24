import type { Scheduler } from 'deck-kit/async/scheduler';
import type { CommandRunner } from 'deck-kit/process/run_command';

import { ListenSettings } from './listen_settings';

export const FAKE_MIC = 'alsa_input.pci-0000_10_00.6.analog-stereo';
export const FAKE_VOLT =
	'alsa_input.usb-Universal_Audio_Volt_1_00000000000000-00.analog-stereo';
export const FAKE_MIC_INDEX = 71;
export const FAKE_VOLT_INDEX = 70;
export const NEW_MODULE_INDEX = 536_870_999;
export const INVALID_SOURCE_INDEX = 4_294_967_295;
const READS_BEFORE_LINKED = 3;

export const instantSchedule: Scheduler = (callback) => {
	callback();
	return () => undefined;
};

type SourceKind = 'hardware' | 'monitor' | 'virtual' | 'hardware-without-api';

export type FakeSource = {
	index: number;
	name: string;
	levels: number[];
	kind: SourceKind;
};

export type FakeStream = {
	ownerModule: number;
	sourceIndex: number;
	levels: number[];
};

export type LoadBehavior =
	| 'normal'
	| 'linked-to-other-source'
	| 'loud-capture'
	| 'loud-playback'
	| 'no-stream'
	| 'tag-missing'
	| 'linked-late'
	| 'never-linked'
	| 'fail-after-loading'
	| 'fail-without-loading';

type FakeSystemOptions = Readonly<{
	sources?: FakeSource[];
	applyVolume?: boolean;
	loadBehavior?: LoadBehavior;
	modules?: string[];
	captureStreams?: FakeStream[];
	playbackStreams?: FakeStream[];
}>;

function buildChannels(levels: readonly number[]): Record<string, unknown> {
	const names = ['front-left', 'front-right', 'front-center'];
	return Object.fromEntries(
		levels.map((level, position) => [
			names[position] ?? `aux${position}`,
			{
				value: Math.round(level * 65_536),
				value_percent: `${Math.round(level * 1000) / 10}%`,
			},
		])
	);
}

const SOURCE_PROPERTIES: Record<SourceKind, Record<string, string>> = {
	hardware: { 'media.class': 'Audio/Source', 'device.api': 'alsa' },
	monitor: {
		'media.class': 'Audio/Sink',
		'device.api': 'alsa',
		'device.class': 'monitor',
	},
	virtual: { 'media.class': 'Audio/Source/Virtual' },
	'hardware-without-api': { 'media.class': 'Audio/Source' },
};

export function buildSourceJson(source: Readonly<FakeSource>): unknown {
	return {
		index: source.index,
		name: source.name,
		description: source.name,
		mute: false,
		volume: buildChannels(source.levels),
		active_port: 'analog-input',
		monitor_source: source.kind === 'monitor' ? 'some.sink' : '',
		properties: SOURCE_PROPERTIES[source.kind],
	};
}

export function buildStreamJson(stream: Readonly<FakeStream>): unknown {
	return {
		index: stream.ownerModule + 1,
		owner_module: String(stream.ownerModule),
		source: stream.sourceIndex,
		volume: buildChannels(stream.levels),
	};
}

export function buildFakeMic(levels: number[] = [0.08, 0.08]): FakeSource {
	return { index: FAKE_MIC_INDEX, name: FAKE_MIC, levels, kind: 'hardware' };
}

export function buildFakeVolt(): FakeSource {
	return {
		index: FAKE_VOLT_INDEX,
		name: FAKE_VOLT,
		levels: [1, 1],
		kind: 'hardware',
	};
}

export function buildLoopbackRow(
	moduleIndex: number,
	sourceId: string,
	isTagged = false
): string {
	const tag = isTagged
		? ` source_output_properties="node.dont-fallback=true ${ListenSettings.loopbackTag}"`
		: '';
	return `${moduleIndex}\tmodule-loopback\tsource=${sourceId} latency_msec=1${tag}\t`;
}

/** A system that answers `pactl` from a state it changes on `set-source-volume`, `load-module` and `unload-module`; it records every call. */
export function createFakeListenSystem(options: FakeSystemOptions = {}) {
	const sources = options.sources ?? [buildFakeMic(), buildFakeVolt()];
	const modules = [
		...(options.modules ?? [
			'1\tlibpipewire-module-rt\t{',
			'            nice.level    = -11',
			'        }\t',
		]),
	];
	const captureStreams = [...(options.captureStreams ?? [])];
	const playbackStreams = [...(options.playbackStreams ?? [])];
	const calls: string[][] = [];
	const timeouts: Array<number | undefined> = [];
	const behavior = options.loadBehavior ?? 'normal';

	const findSource = (name: string): FakeSource | undefined =>
		sources.find((source) => source.name === name);

	let isLoaded = false;
	let readsAfterLoad = 0;

	const linkLateStreams = (): void => {
		if (!isLoaded || behavior !== 'linked-late') {
			return;
		}
		readsAfterLoad += 1;
		if (readsAfterLoad > READS_BEFORE_LINKED) {
			for (const stream of captureStreams) {
				stream.sourceIndex = FAKE_MIC_INDEX;
			}
		}
	};

	const loadModule = (args: readonly string[]): string => {
		if (behavior === 'fail-without-loading') {
			throw new Error('load-module failed');
		}
		const sourceName =
			args.find((arg) => arg.startsWith('source='))?.slice(7) ?? '';
		modules.push(
			`${NEW_MODULE_INDEX}\tmodule-loopback\t${args.slice(2).join(' ')}\t`.replace(
				behavior === 'tag-missing' ? ListenSettings.loopbackTag : '\0',
				''
			)
		);
		const isUnlinked =
			behavior === 'linked-late' || behavior === 'never-linked';
		isLoaded = true;
		const linkedIndex = isUnlinked
			? INVALID_SOURCE_INDEX
			: behavior === 'linked-to-other-source'
				? FAKE_VOLT_INDEX
				: (findSource(sourceName)?.index ?? 0);
		if (behavior !== 'no-stream') {
			captureStreams.push({
				ownerModule: NEW_MODULE_INDEX,
				sourceIndex: linkedIndex,
				levels: behavior === 'loud-capture' ? [1.2, 1.2] : [1, 1],
			});
			playbackStreams.push({
				ownerModule: NEW_MODULE_INDEX,
				sourceIndex: 0,
				levels: behavior === 'loud-playback' ? [1.5, 1.5] : [1, 1],
			});
		}
		if (behavior === 'fail-after-loading') {
			throw new Error('load-module failed');
		}
		return `${NEW_MODULE_INDEX}\n`;
	};

	const unloadModule = (moduleIndex: string): void => {
		const rowIndex = modules.findIndex((row) =>
			row.startsWith(`${moduleIndex}\t`)
		);
		if (rowIndex >= 0) {
			modules.splice(rowIndex, 1);
		}
		const owner = Number(moduleIndex);
		for (const streams of [captureStreams, playbackStreams]) {
			const kept = streams.filter((stream) => stream.ownerModule !== owner);
			streams.splice(0, streams.length, ...kept);
		}
	};

	const setVolume = (name: string, percentArgument: string): void => {
		const source = findSource(name);
		if (source === undefined || options.applyVolume === false) {
			return;
		}
		source.levels = source.levels.map(
			() => Number.parseFloat(percentArgument) / 100
		);
	};

	const answerPactl = (args: readonly string[]): string => {
		const jsonArgs = args[0] === '-f' ? args.slice(2) : args;
		const [verb, target, third] = jsonArgs;
		if (verb === 'list' && target === 'sources') {
			return JSON.stringify(sources.map(buildSourceJson));
		}
		if (verb === 'list' && target === 'source-outputs') {
			linkLateStreams();
			return JSON.stringify(captureStreams.map(buildStreamJson));
		}
		if (verb === 'list' && target === 'sink-inputs') {
			return JSON.stringify(playbackStreams.map(buildStreamJson));
		}
		if (verb === 'list' && target === 'short' && third === 'modules') {
			return `${modules.join('\n')}\n`;
		}
		if (
			verb === 'set-source-volume' &&
			target !== undefined &&
			third !== undefined
		) {
			setVolume(target, third);
		}
		if (verb === 'unload-module' && target !== undefined) {
			unloadModule(target);
		}
		if (verb === 'load-module') {
			return loadModule(jsonArgs);
		}
		return '';
	};

	const runCommand: CommandRunner = (commandOptions) => {
		calls.push([...commandOptions.args]);
		timeouts.push(commandOptions.timeoutMilliseconds);
		try {
			return Promise.resolve(answerPactl(commandOptions.args));
		} catch (error) {
			return Promise.reject(
				error instanceof Error ? error : new Error('pactl failed')
			);
		}
	};

	const writes = (): string[][] =>
		calls.filter((args) => args[0] !== '-f' && args[0] !== 'list');

	return { runCommand, calls, timeouts, writes, modules, sources };
}
