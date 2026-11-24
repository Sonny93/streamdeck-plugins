import { assertListenSource } from './assert_listen_source';
import { clampListenLevel } from './clamp_listen_level';
import { formatPercentArgument } from './format_percent_argument';
import type { ListenContext } from './listen_context';
import { ListenLevelNotAppliedError } from './listen_level_not_applied_error';
import { ListenSettings } from './listen_settings';
import { pollUntil } from './poll_until';
import { readListenSources } from './read_listen_sources';

async function isLevelApplied(
	context: ListenContext,
	sourceId: string,
	ceiling: number
): Promise<true | undefined> {
	const sources = await readListenSources(context);
	const source = sources.find((candidate) => candidate.id === sourceId);
	return source !== undefined && source.loudestLevel <= ceiling
		? true
		: undefined;
}

/**
 * Sets the volume of a listed hardware input, then reads it back until its loudest channel is at the level.
 * Throws `ListenLevelNotAppliedError` when it never is.
 */
export async function setSourceLevel(
	context: ListenContext,
	sourceId: string,
	level: number
): Promise<void> {
	const argument = formatPercentArgument(level);
	await assertListenSource(context, sourceId);
	await context.run({
		command: 'pactl',
		args: ['set-source-volume', sourceId, argument],
	});
	const ceiling = clampListenLevel(level) + ListenSettings.levelTolerance;
	const isApplied = await pollUntil(context, () =>
		isLevelApplied(context, sourceId, ceiling)
	);
	if (isApplied === undefined) {
		throw new ListenLevelNotAppliedError(sourceId);
	}
}
