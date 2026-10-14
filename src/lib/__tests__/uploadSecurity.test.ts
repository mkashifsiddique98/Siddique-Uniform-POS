import {
  extensionForMimeType,
  hasValidMagicBytes,
  safeUploadFilename,
  MAX_UPLOAD_BYTES,
  MAX_UPLOAD_FILES,
} from "../uploadSecurity";

describe("uploadSecurity", () => {
  test("only image MIME types are allowed", () => {
    expect(extensionForMimeType("image/png")).toBe(".png");
    expect(extensionForMimeType("IMAGE/JPEG")).toBe(".jpg");
    expect(extensionForMimeType("image/svg+xml")).toBeNull();
    expect(extensionForMimeType("text/html")).toBeNull();
    expect(extensionForMimeType("application/x-msdownload")).toBeNull();
  });

  test("magic bytes must match the declared type", () => {
    const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0]);
    expect(hasValidMagicBytes(png, "image/png")).toBe(true);
    expect(hasValidMagicBytes(png, "image/jpeg")).toBe(false);
    expect(hasValidMagicBytes(Buffer.from("<script>alert(1)</script>"), "image/png")).toBe(false);
  });

  test("safeUploadFilename rejects traversal and non-generated names", () => {
    const ok = "123e4567-e89b-12d3-a456-426614174000.png";
    expect(safeUploadFilename(ok)).toBe(ok);
    expect(safeUploadFilename("../../.env")).toBeNull();
    expect(safeUploadFilename("..\\..\\secret.png")).toBeNull();
    expect(safeUploadFilename("shell.php")).toBeNull();
  });

  test("limits are set", () => {
    expect(MAX_UPLOAD_BYTES).toBe(5 * 1024 * 1024);
    expect(MAX_UPLOAD_FILES).toBeGreaterThan(0);
  });
});
