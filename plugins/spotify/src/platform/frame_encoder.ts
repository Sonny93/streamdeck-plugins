/**
 * Turns the SVG of a touch strip frame into the image value Stream Deck software displays: an SVG data URL, or a PNG one where SVGs cannot embed pictures.
 * Resolves to `undefined` when the frame cannot be rendered, so the caller keeps the image already shown.
 */
export type FrameEncoder = (svg: string) => Promise<string | undefined>;
