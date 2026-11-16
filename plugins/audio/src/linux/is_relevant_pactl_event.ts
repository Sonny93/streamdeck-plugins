const RELEVANT_FACILITIES = new Set(['sink', 'source', 'server']);
const EVENT_PATTERN = /^Event '[a-z]+' on ([a-z-]+)/u;

/**
 * Tells whether a line of `pactl subscribe` reports a change the plugin shows: a device (sink or source) or the default device (server).
 * Streams, clients and cards change all the time while audio plays and are not shown.
 */
export function isRelevantPactlEvent(line: string): boolean {
	const facility = EVENT_PATTERN.exec(line)?.[1];
	return facility !== undefined && RELEVANT_FACILITIES.has(facility);
}
