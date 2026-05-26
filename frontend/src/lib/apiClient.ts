const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const BYPASS = process.env.NEXT_PUBLIC_BYPASS_AUTH === "true";
const DEV_TOKEN =
  process.env.NEXT_PUBLIC_DEV_BYPASS_TOKEN ?? "dev-local-secret-2026";

function resolveToken(token?: string | null): string | undefined {
  return BYPASS ? DEV_TOKEN : (token ?? undefined);
}

function authHeaders(token?: string | null, extra?: HeadersInit): Headers {
  const h = new Headers(extra);
  const t = resolveToken(token);
  if (t) h.set("Authorization", `Bearer ${t}`);
  return h;
}

export async function apiGet<T>(
  path: string,
  token?: string | null,
): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: authHeaders(token, { "Content-Type": "application/json" }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json() as Promise<T>;
}

export async function apiPost<T>(
  path: string,
  body: unknown,
  token?: string | null,
): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: authHeaders(token, { "Content-Type": "application/json" }),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json() as Promise<T>;
}

export async function apiDelete(
  path: string,
  token?: string | null,
): Promise<void> {
  const res = await fetch(`${API_URL}${path}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
  if (!res.ok && res.status !== 204) throw new Error(`HTTP ${res.status}`);
}

export async function apiPatch<T>(
  path: string,
  body: unknown,
  token?: string | null,
): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: "PATCH",
    headers: authHeaders(token, { "Content-Type": "application/json" }),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json() as Promise<T>;
}

// For multipart/form-data — do NOT set Content-Type; browser adds the boundary
export async function apiUpload<T>(
  path: string,
  formData: FormData,
  token?: string | null,
): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: authHeaders(token),
    body: formData,
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json() as Promise<T>;
}
