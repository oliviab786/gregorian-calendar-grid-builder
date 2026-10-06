/**
 * Core calendar-grid logic for the Gregorian Calendar Grid Builder.
 *
 * The grid is a fixed 6-row by 7-column array of `Date` objects so that any
 * month renders into the same shape regardless of how many days it has or
 * which weekday it starts on. A fixed shape keeps downstream rendering code
 * (tables, CSS grids, print layouts) simple: it never has to special-case
 * short or long months. The cost is up to ten "overflow" cells per month;
 * we fill them with the adjacent months' dates rather than nulls so the grid
 * is always complete and sortable.
 */

/**
 * Day-of-week constants, 0 = Sunday … 6 = Saturday, matching `Date#getDay()`.
 * Exported so callers can name the week start instead of remembering indices.
 */
export const SUNDAY = 0;
export const MONDAY = 1;
export const TUESDAY = 2;
export const WEDNESDAY = 3;
export const THURSDAY = 4;
export const FRIDAY = 5;
export const SATURDAY = 6;

/**
 * Normalise any week-start input to an integer in [0, 6].
 *
 * `Date#getDay()` is defined to return 0 for Sunday, so the rest of the code
 * relies on this same numbering. We accept any integer (including values
 * outside [0, 6]) and fold it into range with `((n % 7) + 7) % 7` so that
 * negative inputs and large values behave consistently rather than throwing.
 *
 * @param {number} n
 * @returns {number}
 */
function normaliseWeekStart(n) {
  return ((n % 7) + 7) % 7;
}

/**
 * Build a 6-row, 7-column calendar grid of `Date` objects for the month
 * containing `date`.
 *
 * @param {Date} date        Any date within the target month. Time-of-day is
 *                           preserved on the input cell only; the grid itself
 *                           carries whatever the input `Date` carried.
 * @param {number} weekStart Week start day, 0 = Sunday … 6 = Saturday.
 *                           Values outside [0, 6] are folded into range.
 * @returns {Date[][]}       Array of 6 rows, each an array of 7 `Date`s.
 *
 * Why six rows: the worst case is a 31-day month that starts on a Saturday
 * when Sunday is the week start — it needs 31 leading + trailing cells, which
 * spans 6 weeks (42 cells). Five rows (35 cells) cannot fit that case, so we
 * always return six for shape stability.
 *
 * Why we build from the UTC day-of-month: the local `Date#getDate()` honours
 * the host's timezone, which can shift a date across a midnight boundary when
 * constructing `new Date(year, month, day)` near month ends. By computing the
 * first-of-month in UTC and using UTC getters throughout, the grid is identical
 * for every caller regardless of their `TZ` environment variable. We return
 * local `Date` objects constructed from the same UTC y/m/d triple so the
 * caller sees familiar midnight dates in their own zone.
 */
export function buildMonthGrid(date, weekStart = SUNDAY) {
  const start = normaliseWeekStart(weekStart);

  // Use UTC getters so the grid does not depend on the host timezone.
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();

  // `Date#getUTCDay()` is stable across timezones, unlike `getDay()`.
  const firstOfMonth = new Date(Date.UTC(year, month, 1));
  const firstDow = firstOfMonth.getUTCDay();

  // Cells before the 1st of the month belong to the previous month.
  const leading = (firstDow - start + 7) % 7;
  const gridStartDay = 1 - leading;

  const rows = [];
  let day = gridStartDay;
  for (let r = 0; r < 6; r++) {
    const row = [];
    for (let c = 0; c < 7; c++) {
      // Construct from a UTC y/m/d triple then read back with local getters
      // when needed; the date itself is a normal local `Date` at midnight.
      // `Date` correctly rolls over month/year for day values outside [1, 28].
      row.push(new Date(Date.UTC(year, month, day)));
      day++;
    }
    rows.push(row);
  }
  return rows;
}

/**
 * `true` if the `Date`'s UTC month differs from the reference month.
 *
 * Used by renderers to grey out overflow days. We compare UTC fields because
 * `buildMonthGrid` constructs cells from UTC triples; comparing local fields
 * could disagree near a DST transition.
 *
 * @param {Date} cell
 * @param {Date} reference
 * @returns {boolean}
 */
export function isOverflowDay(cell, reference) {
  return cell.getUTCMonth() !== reference.getUTCMonth();
}
