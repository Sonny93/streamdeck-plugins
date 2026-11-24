const LISTEN_FACILITIES = new Set([
	'source',
	'module',
	'source-output',
	'sink-input',
]);
const EVENT_PATTERN = /^Event '[a-z]+' on ([a-z-]+)/u;

/**
 * Tells whether a line of `pactl subscribe` reports a change that matters to listening: a source (its volume or port),
 * a module (a loopback loaded or unloaded) or a stream (the capture and playback streams of a loopback).
 * Sinks, clients and the server are not read for it.
 */
export function isListenPactlEvent(line: string): boolean {
	const facility = EVENT_PATTERN.exec(line)?.[1];
	return facility !== undefined && LISTEN_FACILITIES.has(facility);
}
