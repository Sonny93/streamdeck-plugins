import { z } from 'zod';

import type { KscreenOutput } from './kscreen_output';

const PERCENT = 100;
const PRIMARY_PRIORITY = 1;
const SCALE_EPSILON = 1e-6;
const CONNECTOR_PATTERN = /^[A-Za-z0-9_-]+$/u;

const outputSchema = z.object({
	name: z.string().regex(CONNECTOR_PATTERN),
	enabled: z.boolean(),
	priority: z.number().optional().catch(undefined),
	pos: z.object({ x: z.number(), y: z.number() }),
	size: z.object({ width: z.number(), height: z.number() }),
	scale: z.number().positive().optional().catch(undefined),
	hdr: z.boolean().optional().catch(undefined),
	brightness: z.number().optional().catch(undefined),
	'sdr-brightness': z.number().optional().catch(undefined),
	ddcCiAllowed: z.boolean().optional().catch(undefined),
});

const configurationSchema = z.object({ outputs: z.array(z.unknown()) });

type RawOutput = z.infer<typeof outputSchema>;

function safeParseJson(json: string): unknown {
	try {
		return JSON.parse(json);
	} catch {
		return undefined;
	}
}

function toLogicalPixels(pixels: number, scale: number): number {
	return Math.ceil(pixels / scale - SCALE_EPSILON);
}

function toKscreenOutput(raw: RawOutput): KscreenOutput {
	const scale = raw.scale ?? 1;
	return {
		connector: raw.name,
		isPrimary: raw.priority === PRIMARY_PRIORITY,
		bounds: {
			left: raw.pos.x,
			top: raw.pos.y,
			width: toLogicalPixels(raw.size.width, scale),
			height: toLogicalPixels(raw.size.height, scale),
		},
		hdr: { isSupported: raw.hdr !== undefined, isEnabled: raw.hdr === true },
		brightnessPercent:
			raw.brightness === undefined
				? undefined
				: Math.round(raw.brightness * PERCENT),
		sdrBrightnessNits: raw['sdr-brightness'],
		isDdcCiAllowed: raw.ddcCiAllowed === true,
	};
}

/**
 * Reads the enabled outputs out of the JSON of `kscreen-doctor -j`; outputs it cannot fully describe are skipped.
 * The `hdr` key is missing on outputs that cannot show HDR, and `brightness` is a fraction from 0 to 1.
 */
export function parseKscreenOutputs(json: string): KscreenOutput[] {
	const configuration = configurationSchema.safeParse(safeParseJson(json));
	if (!configuration.success) {
		return [];
	}
	return configuration.data.outputs.flatMap((candidate) => {
		const parsed = outputSchema.safeParse(candidate);
		return parsed.success && parsed.data.enabled
			? [toKscreenOutput(parsed.data)]
			: [];
	});
}
