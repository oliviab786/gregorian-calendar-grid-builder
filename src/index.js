/**
 * Public entry point for the Gregorian Calendar Grid Builder.
 *
 * Re-exports the grid builder, its weekday constants, and the overflow
 * predicate so callers can import everything from the package root.
 */
export {
  buildMonthGrid,
  isOverflowDay,
  SUNDAY,
  MONDAY,
  TUESDAY,
  WEDNESDAY,
  THURSDAY,
  FRIDAY,
  SATURDAY,
} from "./core.js";
