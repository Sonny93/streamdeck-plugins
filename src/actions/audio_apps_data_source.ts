import { z } from 'zod';

const EVENT = 'listAudioApps';
const requestSchema = z.object({ event: z.literal(EVENT) });

/** The data source through which the "Volume" property inspector asks for the apps playing sound (sdpi-components `datasource` protocol). */
export const AudioAppsDataSource = {
	event: EVENT,
	isRequest: (payload: unknown): boolean =>
		requestSchema.safeParse(payload).success,
} as const;
