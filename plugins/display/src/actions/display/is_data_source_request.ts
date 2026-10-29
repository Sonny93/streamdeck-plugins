import { z } from 'zod';

const requestSchema = z.object({ event: z.string() });

/** Tells whether a message of a property inspector asks for the items of a data source event (sdpi-components `datasource` protocol). */
export function isDataSourceRequest(payload: unknown, event: string): boolean {
	const parsed = requestSchema.safeParse(payload);
	return parsed.success && parsed.data.event === event;
}
