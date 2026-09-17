const encoder = new TextEncoder();

async function getKey(secret: string) {
  return crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, [
    "sign",
    "verify",
  ]);
}

function toHex(buffer: ArrayBuffer) {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

const SESSION_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 30; // 30일

export async function createSessionToken(): Promise<string> {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET 환경변수가 설정되지 않았습니다.");
  const expiry = Date.now() + SESSION_MAX_AGE_MS;
  const key = await getKey(secret);
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(String(expiry)));
  return `${expiry}.${toHex(signature)}`;
}

export async function verifySessionToken(token: string | undefined): Promise<boolean> {
  const secret = process.env.AUTH_SECRET;
  if (!secret || !token) return false;

  const [expiryStr, signatureHex] = token.split(".");
  const expiry = Number(expiryStr);
  if (!expiry || Number.isNaN(expiry) || Date.now() > expiry || !signatureHex) return false;

  const key = await getKey(secret);
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(String(expiry)));
  const expectedHex = toHex(signature);

  if (expectedHex.length !== signatureHex.length) return false;
  let diff = 0;
  for (let i = 0; i < expectedHex.length; i++) {
    diff |= expectedHex.charCodeAt(i) ^ signatureHex.charCodeAt(i);
  }
  return diff === 0;
}

export const SESSION_COOKIE_NAME = "danbo_session";
export const SESSION_MAX_AGE_SECONDS = SESSION_MAX_AGE_MS / 1000;
