/** One little-endian field of a zip record, as its width in bytes then its value. */
export type ZipField = readonly [width: number, value: number];
