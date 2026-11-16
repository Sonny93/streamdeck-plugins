/** Builds a function that logs each distinct error message once, so a frame that keeps failing does not flood the log. */
export function createRenderErrorReporter(
	log: (message: string, error: unknown) => void
): (error: unknown) => void {
	const reported = new Set<string>();
	return (error) => {
		const message = error instanceof Error ? error.message : String(error);
		if (reported.has(message)) {
			return;
		}
		reported.add(message);
		log('Cannot render a strip frame', error);
	};
}
