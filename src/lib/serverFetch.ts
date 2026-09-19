import { cookies, headers } from "next/headers";

function getBaseUrl(): string {
  const requestHeaders = headers();
  const host = requestHeaders.get("host");
  if (host) {
    const protocol = requestHeaders.get("x-forwarded-proto") || (process.env.NODE_ENV === "production" ? "https" : "http");
    return `${protocol}://${host}`;
  }
  return process.env.DOMAIN_NAME || "http://localhost:3000";
}

export function serverApiUrl(endpoint: string): string {
  return `${getBaseUrl()}${endpoint}`;
}

export async function serverFetch(endpoint: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);
  const cookieHeader = cookies().toString();
  if (cookieHeader) headers.set("Cookie", cookieHeader);

  return fetch(serverApiUrl(endpoint), {
    ...init,
    headers,
  });
}
