import { createUserSchema, updateUserSchema } from "../user";

describe("user validation", () => {
  const valid = { name: "Ali", email: "ali@pos.com", password: "secret1", role: "employee", pages: ["pos"] };

  test("accepts a valid new user", () => {
    expect(createUserSchema.safeParse(valid).success).toBe(true);
  });

  test("rejects missing password, bad email, unknown role and unknown page", () => {
    expect(createUserSchema.safeParse({ ...valid, password: undefined }).success).toBe(false);
    expect(createUserSchema.safeParse({ ...valid, password: "123" }).success).toBe(false);
    expect(createUserSchema.safeParse({ ...valid, email: "nope" }).success).toBe(false);
    expect(createUserSchema.safeParse({ ...valid, role: "root" }).success).toBe(false);
    expect(createUserSchema.safeParse({ ...valid, pages: ["secret"] }).success).toBe(false);
  });

  test("update drops unknown keys so they cannot be mass-assigned", () => {
    const result = updateUserSchema.parse({ name: "Ali", _id: "x", __v: 9, isAdmin: true });
    expect(result).toEqual({ name: "Ali" });
  });

  test("update allows an empty password (keep current)", () => {
    expect(updateUserSchema.safeParse({ password: "" }).success).toBe(true);
    expect(updateUserSchema.safeParse({ password: "abc" }).success).toBe(false);
  });
});
