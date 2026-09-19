import { jwtVerify, JWTPayload } from "jose";
import { NextResponse } from "next/server";

export type AuthUser = JWTPayload & {
  userId?: string;
  role?: string;
  pages?: string[];
};

type AuthOptions = {
  role?: "admin" | "employee";
  page?: string;
};

type AuthResult =
  | { ok: true; user: AuthUser }
  | { ok: false; response: NextResponse };

function unauthorized(message = "Unauthorized"): AuthResult {
  return { ok: false, response: NextResponse.json({ error: message }, { status: 401 }) };
}

function forbidden(): AuthResult {
  return { ok: false, response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
}

export async function requireAuth(req: Request, options: AuthOptions = {}): Promise<AuthResult> {
  const secretValue = process.env.JWT_SECRET;
  if (!secretValue || secretValue.length < 32) {
    throw new Error("JWT_SECRET must be configured with at least 32 characters");
  }

  const token = req.headers.get("cookie")
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith("token="))
    ?.slice("token=".length);

  if (!token) return unauthorized();

  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secretValue));
    const user = payload as AuthUser;
    if (!user.userId || !user.role) return unauthorized("Invalid session");
    if (options.role && user.role !== options.role) return forbidden();

    if (options.page && user.role !== "admin" && !user.pages?.some((page) => page.toLowerCase() === options.page?.toLowerCase())) {
      return forbidden();
    }

    return { ok: true, user };
  } catch {
    return unauthorized("Invalid session");
  }
}

export async function getVerifiedUser(req: Request): Promise<AuthUser | null> {
  const result = await requireAuth(req);
  return result.ok ? result.user : null;
}