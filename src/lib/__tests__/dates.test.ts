import { describe, expect, it } from "vitest";
import {
  addDays,
  dateKey,
  dateFromKey,
  formatWeekdayDayMonth,
  loggableDate,
  todayKey,
} from "../dates";

describe("loggableDate (Stage 14A add-food date boundary)", () => {
  it("passes through a well-formed past date", () => {
    const yesterday = dateKey(addDays(new Date(), -1));
    expect(loggableDate(yesterday)).toBe(yesterday);
  });

  it("accepts today (History may pass the current day)", () => {
    expect(loggableDate(todayKey())).toBe(todayKey());
  });

  it("rejects a future date — future entries are impossible", () => {
    const tomorrow = dateKey(addDays(new Date(), 1));
    expect(loggableDate(tomorrow)).toBeUndefined();
    const farFuture = dateKey(addDays(new Date(), 365));
    expect(loggableDate(farFuture)).toBeUndefined();
  });

  it("rejects malformed keys", () => {
    expect(loggableDate("17-09-2026")).toBeUndefined();
    expect(loggableDate("2026/09/17")).toBeUndefined();
    expect(loggableDate("2026-9-17")).toBeUndefined();
    expect(loggableDate("понедельник")).toBeUndefined();
  });

  it("rejects missing values (the Today flow passes none)", () => {
    expect(loggableDate(undefined)).toBeUndefined();
    expect(loggableDate(null)).toBeUndefined();
    expect(loggableDate("")).toBeUndefined();
  });
});

describe("dateFromKey", () => {
  it("parses a local date without UTC shifts", () => {
    const date = dateFromKey("2026-09-16");
    expect(date.getFullYear()).toBe(2026);
    expect(date.getMonth()).toBe(8);
    expect(date.getDate()).toBe(16);
  });

  it("round-trips dateKey", () => {
    const now = new Date();
    expect(dateKey(dateFromKey(dateKey(now)))).toBe(dateKey(now));
  });
});

describe("formatWeekdayDayMonth (add-food date context label)", () => {
  it("formats with a capitalized weekday first", () => {
    // 2026-09-16 is a Wednesday.
    expect(formatWeekdayDayMonth("2026-09-16")).toBe("Среда, 16 сентября");
  });

  it("formats another weekday", () => {
    // 2026-09-21 is a Monday.
    expect(formatWeekdayDayMonth("2026-09-21")).toBe("Понедельник, 21 сентября");
  });
});
