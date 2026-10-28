const MILLISECONDS_PER_SECOND = 1_000;
const SECONDS_PER_MINUTE = 60;
const MINUTES_PER_HOUR = 60;
const TWO_DIGITS = 2;

function padTwoDigits(value: number): string {
	return String(value).padStart(TWO_DIGITS, '0');
}

/** Formats a playback time as `m:ss`, or `h:mm:ss` from one hour on; negative times count as zero. */
export function formatTrackTime(milliseconds: number): string {
	const totalSeconds = Math.floor(
		Math.max(0, milliseconds) / MILLISECONDS_PER_SECOND
	);
	const seconds = totalSeconds % SECONDS_PER_MINUTE;
	const totalMinutes = Math.floor(totalSeconds / SECONDS_PER_MINUTE);
	if (totalMinutes < MINUTES_PER_HOUR) {
		return `${totalMinutes}:${padTwoDigits(seconds)}`;
	}
	const hours = Math.floor(totalMinutes / MINUTES_PER_HOUR);
	const minutes = totalMinutes % MINUTES_PER_HOUR;
	return `${hours}:${padTwoDigits(minutes)}:${padTwoDigits(seconds)}`;
}
