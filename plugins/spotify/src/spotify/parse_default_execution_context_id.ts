import { z } from 'zod';

const executionContextCreatedSchema = z.object({
	context: z.object({
		id: z.number(),
		auxData: z.object({ isDefault: z.boolean().optional() }).optional(),
	}),
});

/**
 * Reads the params of a `Runtime.executionContextCreated` event.
 * Returns the context id when it is a frame's default context, where Spotify's own scripts run; otherwise `undefined`.
 */
export function parseDefaultExecutionContextId(
	params: unknown
): number | undefined {
	const parsed = executionContextCreatedSchema.safeParse(params);
	if (!parsed.success || parsed.data.context.auxData?.isDefault !== true) {
		return undefined;
	}
	return parsed.data.context.id;
}
