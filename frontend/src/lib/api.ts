// Client-side API helper for the Farm Management backend.
// The base URL is configurable via localStorage ("farm_api_base") because
// the backend runs on the farmer's machine (e.g. http://127.0.0.1:8000).

const DEFAULT_BASE = "http://127.0.0.1:8000";

export function getApiBase(): string {
  if (typeof window === "undefined") return DEFAULT_BASE;
  return window.localStorage.getItem("farm_api_base") || DEFAULT_BASE;
}

export function setApiBase(url: string) {
  window.localStorage.setItem("farm_api_base", url.replace(/\/$/, ""));
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem("farm_token");
}

export function setToken(token: string | null) {
  if (token) window.localStorage.setItem("farm_token", token);
  else window.localStorage.removeItem("farm_token");
  window.dispatchEvent(new Event("farm-auth-changed"));
}

export class ApiError extends Error {
  status: number;
  data: unknown;
  constructor(status: number, message: string, data?: unknown) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

export async function api<T = unknown>(
  path: string,
  init: RequestInit & { auth?: boolean; json?: unknown } = {},
): Promise<T> {
  const { auth = true, json, headers, ...rest } = init;
  const h = new Headers(headers);
  if (json !== undefined) {
    h.set("Content-Type", "application/json");
  }
  if (auth) {
    const token = getToken();
    if (token) h.set("Authorization", `Bearer ${token}`);
  }
  const res = await fetch(`${getApiBase()}${path}`, {
    ...rest,
    headers: h,
    body: json !== undefined ? JSON.stringify(json) : rest.body,
  });
  const ctype = res.headers.get("content-type") || "";
  const isJson = ctype.includes("application/json");
  const payload = isJson ? await res.json().catch(() => null) : await res.text();
  if (!res.ok) {
    const msg =
      (isJson && payload && typeof payload === "object" && "detail" in payload
        ? String((payload as { detail: unknown }).detail)
        : typeof payload === "string" && payload
          ? payload
          : res.statusText) || "Request failed";
    if (res.status === 401) {
      setToken(null);
    }
    throw new ApiError(res.status, msg, payload);
  }
  return payload as T;
}

export async function apiBlob(path: string): Promise<Blob> {
  const token = getToken();
  const res = await fetch(`${getApiBase()}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new ApiError(res.status, "Download failed");
  return res.blob();
}
