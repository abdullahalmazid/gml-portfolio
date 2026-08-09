'use client';
/**
 * Mode components
 * src/components/sections/modes/index.js
 *
 * Binds each mode key from the registry to its renderer. This and
 * `modeRegistry.js` are the only two files a new display mode touches:
 * declare its options there, add its component here.
 */

import CarouselMode from './CarouselMode';
import CompactMode from './CompactMode';
import FeaturedMode from './FeaturedMode';
import GridMode from './GridMode';
import HScrollMode from './HScrollMode';
import ListMode from './ListMode';
import MosaicMode from './MosaicMode';
import SplitMode from './SplitMode';
import TimelineMode from './TimelineMode';

export const MODE_COMPONENTS = {
  list: ListMode,
  grid: GridMode,
  timeline: TimelineMode,
  mosaic: MosaicMode,
  hscroll: HScrollMode,
  carousel: CarouselMode,
  featured: FeaturedMode,
  split: SplitMode,
  compact: CompactMode,
};

/** Falls back to the list renderer, which works for every collection. */
export function getModeComponent(key) {
  return MODE_COMPONENTS[key] || MODE_COMPONENTS.list;
}

export {
  CarouselMode,
  CompactMode,
  FeaturedMode,
  GridMode,
  HScrollMode,
  ListMode,
  MosaicMode,
  SplitMode,
  TimelineMode,
};
