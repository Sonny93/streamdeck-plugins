/** What the watchdog allows of a listened source: the loudest level it may show and the port it must stay on. */
export type ListenGuard = {
	allowedLevel: number;
	/** The port the source must stay on; meaningless until `isPortKnown`, which the first successful read sets. */
	port: string | undefined;
	isPortKnown: boolean;
};
