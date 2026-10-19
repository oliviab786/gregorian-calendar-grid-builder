# Gregorian Calendar Grid Builder

Builds a fixed 6-row by 7-column grid of `Date` objects for any Gregorian month, with a configurable week-start day. The grid always has 42 cells; leading and trailing days from the previous and next month fill the overflow so no cell is empty.

## Usage

```js
import {
  buildMonthGrid,
  isOverflowDay,
  SUNDAY,
  MONDAY,
} from "gregorian-calendar-grid-builder";

const grid = buildMonthGrid(new Date(Date.UTC(2024, 0, 1)), SUNDAY);
// grid: Date[6][7]

for (const row of grid) {
  for (const cell of row) {
    const label = isOverflowDay(cell, new Date(Date.UTC(2024, 0, 1)))
      ? "  ."
      : String(cell.getUTCDate()).padStart(3, " ");
    process.stdout.write(label);
  }
  process.stdout.write("\n");
}
```

Exported names: `buildMonthGrid(date, weekStart = SUNDAY)`, `isOverflowDay(cell, reference)`, and the weekday constants `SUNDAY` through `SATURDAY` (0–6).

## Why

Rendering a month as a table or CSS grid is simpler when every month has the same shape. Six rows are the minimum that fits the worst case — a 31-day month that starts on the week-start's last weekday. The trade-off is up to ten overflow cells per month; we fill them with real adjacent dates rather than nulls so the grid is always complete and the dates remain sortable.

## Edge cases

The grid is built from UTC year/month/day triples so the result is identical regardless of the host's `TZ`. If you construct the input `Date` from local components near a month boundary in a timezone with DST, the local fields can shift by a day; pass a `Date` constructed via `Date.UTC(...)` to avoid this. `isOverflowDay` compares UTC months for the same reason.

## Performance

The window keeps a bounded buffer, so `push` is constant time and memory does not
grow with the length of the stream. `peak` and `trough` are linear in the window
size, which is the trade that keeps `push` cheap.

