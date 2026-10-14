import path from "path";

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
export const MAX_UPLOAD_FILES = 10;

const allowedTypes = new Map([
  ["image/png", ".png"],
  ["image/jpeg", ".jpg"],
  ["image/gif", ".gif"],
  ["image/webp", ".webp"],
]);

export function extensionForMimeType(mimeType: string): string | null {
  return allowedTypes.get(mimeType.toLowerCase()) || null;
}

export function hasValidMagicBytes(buffer: Buffer, mimeType: string): boolean {
  const type = mimeType.toLowerCase();
  if (type === "image/png") return buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  if (type === "image/jpeg") return buffer.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]));
  if (type === "image/gif") return buffer.subarray(0, 4).toString("ascii") === "GIF8";
  if (type === "image/webp") return buffer.subarray(0, 4).toString("ascii") === "RIFF" && buffer.subarray(8, 12).toString("ascii") === "WEBP";
  return false;
}

export function safeUploadFilename(filename: string): string | null {
  const base = path.basename(filename);
  return /^[a-f0-9-]{36}\.(png|jpg|gif|webp)$/.test(base) ? base : null;
}
