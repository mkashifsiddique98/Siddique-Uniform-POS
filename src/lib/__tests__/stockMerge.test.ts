import { applyStockRows } from "../stockMerge";

const items = [
  { _id: "a", quantity: 5, oversellMode: "clamp", sellPrice: 10 },
  { _id: "b", quantity: 2, oversellMode: "block", sellPrice: 20 },
];

describe("applyStockRows", () => {
  it("returns the same array when nothing changed", () => {
    const rows = items.map(({ _id, quantity, oversellMode }) => ({ _id, quantity, oversellMode }));
    const result = applyStockRows(items, rows);
    expect(result.items).toBe(items);
    expect(result.structureChanged).toBe(false);
  });

  it("updates only changed products and keeps other fields", () => {
    const result = applyStockRows(items, [
      { _id: "a", quantity: 3, oversellMode: "clamp" },
      { _id: "b", quantity: 2, oversellMode: "block" },
    ]);
    expect(result.items).not.toBe(items);
    expect(result.items[0]).toEqual({ _id: "a", quantity: 3, oversellMode: "clamp", sellPrice: 10 });
    expect(result.items[1]).toBe(items[1]);
  });

  it("picks up an oversell mode change", () => {
    const result = applyStockRows(items, [
      { _id: "a", quantity: 5, oversellMode: "block" },
      { _id: "b", quantity: 2, oversellMode: "block" },
    ]);
    expect(result.items[0].oversellMode).toBe("block");
  });

  it("flags added or removed products", () => {
    expect(applyStockRows(items, [{ _id: "a", quantity: 5, oversellMode: "clamp" }]).structureChanged).toBe(true);
    expect(
      applyStockRows(items, [
        { _id: "a", quantity: 5 },
        { _id: "b", quantity: 2 },
        { _id: "c", quantity: 1 },
      ]).structureChanged
    ).toBe(true);
    expect(
      applyStockRows(items, [
        { _id: "a", quantity: 5 },
        { _id: "z", quantity: 2 },
      ]).structureChanged
    ).toBe(true);
  });
});
