import { formatShopDate, formatShopTime, formatShopDateTime, formatShopStamp, formatReturnTime } from "../formatTime";

describe("formatTime", () => {
  const d = new Date("2024-03-05T09:56:10Z"); // 14:56:10 in Asia/Karachi

  it("formats the return stamp as dd MMM yyyy, hh:mm a in the shop time zone", () => {
    expect(formatShopStamp(d)).toMatch(/^05 Mar 2024, 02:56 pm$/i);
    expect(formatReturnTime(d.toISOString())).toBe(formatShopStamp(d));
  });

  it("shows 'time not recorded' for legacy returns", () => {
    expect(formatReturnTime(undefined)).toBe("time not recorded");
    expect(formatReturnTime("not a date")).toBe("time not recorded");
  });

  it("formats in the shop time zone regardless of the machine", () => {
    expect(formatShopTime(d)).toMatch(/02:56:10\s?pm/i);
    expect(formatShopDate(d)).toBe(new Date(d).toLocaleDateString("en-PK", { timeZone: "Asia/Karachi" }));
  });

  it("is deterministic and accepts strings and numbers", () => {
    expect(formatShopDateTime(d)).toBe(formatShopDateTime(d.toISOString()));
    expect(formatShopDateTime(d)).toBe(formatShopDateTime(d.getTime()));
  });
});
