import { cookies } from "next/headers";

const baseUrl = process.env.DOMAIN_NAME || "http://localhost:3000";

export function serverApiUrl(endpoint: string): string {
  return `${baseUrl}${endpoint}`;
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
