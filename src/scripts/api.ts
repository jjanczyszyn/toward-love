// Thin client for the AWS-backed Script Studio API (API Gateway → Lambda).
// The endpoint is baked at build time from VITE_SCRIPTS_API.
const API = (import.meta.env.VITE_SCRIPTS_API as string | undefined) || "";

export type ScriptDoc = {
  slug: string;
  order: number;
  title: string;
  theme: string;
  tone: string;
  sections: { id: string; title: string; duration?: string; markdown: string }[];
};

async function post<T>(action: string, payload: Record<string, unknown>): Promise<T> {
  if (!API) throw new Error("API endpoint not configured (VITE_SCRIPTS_API).");
  const res = await fetch(API, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ action, ...payload }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as any)?.error || `Request failed (${res.status}).`);
  return data as T;
}

export const apiConfigured = !!API;

export const requestCode = (email: string) =>
  post<{ ok: boolean }>("request_code", { email });

export const verifyCode = (email: string, code: string) =>
  post<{ token: string; expiresAt: number }>("verify_code", { email, code });

export const listScripts = (token: string) =>
  post<{ scripts: ScriptDoc[] }>("list_scripts", { token });

export const emailPdf = (
  token: string,
  filename: string,
  base64: string,
  note?: string,
) => post<{ ok: boolean; emailed: boolean; to?: string }>("email_pdf", {
  token,
  filename,
  base64,
  note,
});
