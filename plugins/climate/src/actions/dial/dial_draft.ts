import type { UnitMode } from '../../daikin/unit_types';

/** A target temperature chosen with the dial and not applied yet, with the mode it was chosen for. */
export type DialDraft = Readonly<{ temperature: number; mode: UnitMode }>;
