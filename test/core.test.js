import { test } from "node:test";
import assert from "node:assert/strict";

import {
  buildMonthGrid,
  isOverflowDay,
  SUNDAY,
  MONDAY,
  SATURDAY,
} from "../src/index.js";

/** Helper: a Date in a given month, at UTC noon to avoid DST edge cases. */
function d(year, month) {
  return new Date(Date.UTC(year, month, 1, 12, 0, 0));
}

test("grid shape is 6 rows by 7 columns", () => {
  const grid = buildMonthGrid(d(2024, 0), SUNDAY);
  assert.equal(grid.length, 6);
  for (const row of grid) {
    assert.equal(row.length, 7);
  }
});

test("every cell is a Date instance", () => {
  const grid = buildMonthGrid(d(2024, 0), SUNDAY);
  for (const row of grid) {
    for (const cell of row) {
      assert.ok(cell instanceof Date, `expected Date, got ${cell}`);
    }
  }
});

test("February 2024 (leap) starting on Sunday includes all 29 days", () => {
  const grid = buildMonthGrid(d(2024, 1), SUNDAY);
  const seen = new Set();
  for (const row of grid) {
    for (const cell of row) {
      if (!isOverflowDay(cell, d(2024, 1))) {
        seen.add(cell.getUTCDate());
      }
    }
  }
  assert.equal(seen.size, 29);
  for (let i = 1; i <= 29; i++) {
    assert.ok(seen.has(i), `missing day ${i}`);
  }
});

test("February 2023 (non-leap) includes all 28 days", () => {
  const grid = buildMonthGrid(d(2023, 1), SUNDAY);
  const seen = new Set();
  for (const row of grid) {
    for (const cell of row) {
      if (!isOverflowDay(cell, d(2023, 1))) {
        seen.add(cell.getUTCDate());
      }
    }
  }
  assert.equal(seen.size, 28);
});

test("31-day month that starts on Saturday (Aug 2025, Sun-start) uses six rows fully", () => {
  // August 2025 starts on a Friday; to force the six-row worst case we pick a
  // 31-day month starting on the week-start's last day. January 2022 starts on
  // a Saturday with Sunday as week start — the classic 6-row case.
  const grid = buildMonthGrid(d(2022, 0), SUNDAY);
  assert.equal(grid.length, 6);
  // First cell is the last Sunday of December 2021.
  assert.equal(grid[0][0].getUTCFullYear(), 2021);
  assert.equal(grid[0][0].getUTCMonth(), 11); // December
  // Last cell is in February 2022.
  assert.equal(grid[5][6].getUTCMonth(), 1);
});

test("week start Monday shifts the first column to Monday", () => {
  const grid = buildMonthGrid(d(2024, 0), MONDAY); // January 2024 starts Monday
  // 1 Jan 2024 is a Monday, so with Monday-start it is the top-left cell.
  const topLeft = grid[0][0];
  assert.equal(topLeft.getUTCFullYear(), 2024);
  assert.equal(topLeft.getUTCMonth(), 0);
  assert.equal(topLeft.getUTCDate(), 1);
});

test("week start Saturday places Saturday in the first column", () => {
  // June 2024 starts on a Saturday. With Saturday as the week start, the 1st
  // occupies the top-left corner.
  const grid = buildMonthGrid(d(2024, 5), SATURDAY);
  const topLeft = grid[0][0];
  assert.equal(topLeft.getUTCMonth(), 5);
  assert.equal(topLeft.getUTCDate(), 1);
});

test("default week start is Sunday", () => {
  // February 2026 starts on a Sunday. With the default (Sunday) start, the
  // 1st is the top-left cell.
  const grid = buildMonthGrid(d(2026, 1));
  const topLeft = grid[0][0];
  assert.equal(topLeft.getUTCFullYear(), 2026);
  assert.equal(topLeft.getUTCMonth(), 1);
  assert.equal(topLeft.getUTCDate(), 1);
});

test("isOverflowDay flags leading and trailing days but not in-month days", () => {
  const ref = d(2024, 0); // January 2024 starts Monday, Sun-start grid
  const grid = buildMonthGrid(ref, SUNDAY);
  // Top-left is the last Sunday of December 2023.
  assert.ok(isOverflowDay(grid[0][0], ref));
  // 1 Jan 2024 is grid[0][1].
  assert.equal(isOverflowDay(grid[0][1], ref), false);
});

test("overflow cells wrap across the correct month boundary", () => {
  // January 2024, Sunday start: grid begins 31 Dec 2023 and ends 10 Feb 2024.
  const ref = d(2024, 0);
  const grid = buildMonthGrid(ref, SUNDAY);
  assert.equal(grid[0][0].getUTCFullYear(), 2023);
  assert.equal(grid[0][0].getUTCMonth(), 11);
  assert.equal(grid[0][0].getUTCDate(), 31);
  assert.equal(grid[5][6].getUTCFullYear(), 2024);
  assert.equal(grid[5][6].getUTCMonth(), 1);
  assert.equal(grid[5][6].getUTCDate(), 10);
});

// Determinism: two calls with equal inputs produce deeply equal grids.
// We compare by UTC timestamp to avoid any local-time noise.
import { test as test2 } from "node:test";
test2("identical inputs produce identical grids (determinism)", () => {
  const a = buildMonthGrid(d(2024, 2), SUNDAY);
  const b = buildMonthGrid(d(2024, 2), SUNDAY);
  assert.equal(a.length, b.length);
  for (let r = 0; r < a.length; r++) {
    for (let c = 0; c < 7; c++) {
      assert.equal(a[r][c].getTime(), b[r][c].getTime());
    }
  }
});

// Out-of-range week start values fold into [0, 6]. 7 ≡ 0 (Sunday), 8 ≡ 1 (Mon).
import { test as test3 } from "node:test";
test3("out-of-range week start 7 behaves as Sunday", () => {
  const ref = d(2024, 0);
  const g7 = buildMonthGrid(ref, 7);
  const g0 = buildMonthGrid(ref, SUNDAY);
  for (let r = 0; r < 6; r++) {
    for (let c = 0; c < 7; c++) {
      assert.equal(g7[r][c].getTime(), g0[r][c].getTime());
    }
  }
});
