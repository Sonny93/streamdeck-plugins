import { CarouselMetrics } from './carousel_metrics';
import type { SlotGeometry } from './slot_geometry';

const HALF = 2;

/**
 * Computes where a carousel cover is drawn for its offset to the centered position.
 * The cover is centered at the strip center when the offset is 0, and moves by one slot spacing per unit of offset;
 * its size and opacity ease linearly from the centered values to the side values as the offset goes from 0 to 1, then stay.
 */
export function resolveSlotGeometry(offset: number): SlotGeometry {
	const distance = Math.min(Math.abs(offset), 1);
	const size =
		CarouselMetrics.centerCoverSize -
		(CarouselMetrics.centerCoverSize - CarouselMetrics.sideCoverSize) *
			distance;
	const centerX =
		CarouselMetrics.stripWidth / HALF + offset * CarouselMetrics.slotSpacing;
	return {
		left: centerX - size / HALF,
		top: CarouselMetrics.coverCenterY - size / HALF,
		size,
		opacity: 1 - (1 - CarouselMetrics.sideOpacity) * distance,
	};
}
