import { KdotoolMissingError } from './kdotool_missing_error';

/** Builds a function that logs the install hint the first time it receives a KdotoolMissingError, and ignores any other error. */
export function createKdotoolMissingReporter(
	log: (message: string) => void
): (error: unknown) => void {
	let isReported = false;
	return (error) => {
		if (isReported || !(error instanceof KdotoolMissingError)) {
			return;
		}
		isReported = true;
		log(error.message);
	};
}
