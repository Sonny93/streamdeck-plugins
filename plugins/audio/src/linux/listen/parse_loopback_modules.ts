import { ListenSettings } from './listen_settings';

const LOOPBACK_ROW_PATTERN = /^(\d+)\tmodule-loopback\t(.*)$/u;
const SOURCE_ARGUMENT_PATTERN = /(?:^|\s)source=(\S+)/u;
const TAG_PATTERN = new RegExp(
	`(?:^|[\\s"])${ListenSettings.loopbackTag.replaceAll('.', '\\.')}(?:$|[\\s"])`,
	'u'
);

/** A `module-loopback` row of `pactl list short modules`. */
export type LoopbackModule = Readonly<{
	moduleIndex: number;
	/** The `source=` token of its argument, when it has one. */
	requestedSourceId: string | undefined;
	/** Its argument carries the tag of the plugin. */
	isPluginLoopback: boolean;
}>;

/**
 * Reads `pactl list short modules` into its loopback rows.
 * Modules of libpipewire print their arguments over several lines, so only a line shaped as a loopback row counts and the others are ignored.
 */
export function parseLoopbackModules(text: string): LoopbackModule[] {
	return text.split('\n').flatMap((line) => {
		const match = LOOPBACK_ROW_PATTERN.exec(line);
		if (match === null) {
			return [];
		}
		const moduleIndex = Number(match[1]);
		if (!Number.isSafeInteger(moduleIndex)) {
			return [];
		}
		const argument = match[2] ?? '';
		return [
			{
				moduleIndex,
				requestedSourceId: SOURCE_ARGUMENT_PATTERN.exec(argument)?.[1],
				isPluginLoopback: TAG_PATTERN.test(argument),
			},
		];
	});
}
