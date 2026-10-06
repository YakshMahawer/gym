import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";

export interface SessionUser {
  id: string;
  username: string;
  role: Role;
  name: string;
}

const SESSION_COOKIE_NAME = "gym_session";
const JWT_SECRET = process.env.SESSION_SECRET || "concept-1-gym-crm-secure-session-secret-key-2026";

// Web Crypto HMAC-SHA256 based signed tokens (Edge and Node compatible)
async function getSigningKey(): Promise<CryptoKey> {
  const enc = new TextEncoder();
  return crypto.subtle.importKey(
    "raw",
    enc.encode(JWT_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function base64UrlDecode(str: string): Uint8Array {
  str = str.replace(/-/g, "+").replace(/_/g, "/");
  while (str.length % 4) {
    str += "=";
  }
  const binary = atob(str);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export async function createSessionToken(user: SessionUser): Promise<string> {
  const enc = new TextEncoder();
  const header = { alg: "HS256", typ: "JWT" };
  const payload = {
    ...user,
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30, // 30 days
    iat: Math.floor(Date.now() / 1000),
  };

  const headerEncoded = base64UrlEncode(enc.encode(JSON.stringify(header)));
  const payloadEncoded = base64UrlEncode(enc.encode(JSON.stringify(payload)));
  const dataToSign = enc.encode(`${headerEncoded}.${payloadEncoded}`);

  const key = await getSigningKey();
  const signature = await crypto.subtle.sign("HMAC", key, dataToSign);
  const signatureEncoded = base64UrlEncode(new Uint8Array(signature));

  return `${headerEncoded}.${payloadEncoded}.${signatureEncoded}`;
}

export async function verifySessionToken(token: string): Promise<SessionUser | null> {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const [headerB64, payloadB64, sigB64] = parts;
    const enc = new TextEncoder();
    const dataToVerify = enc.encode(`${headerB64}.${payloadB64}`);
    const signature = base64UrlDecode(sigB64);

    const key = await getSigningKey();
    const isValid = await crypto.subtle.verify("HMAC", key, signature as unknown as BufferSource, dataToVerify as unknown as BufferSource);
    if (!isValid) return null;

    const payloadJson = new TextDecoder().decode(base64UrlDecode(payloadB64));
    const payload = JSON.parse(payloadJson);

    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return {
      id: payload.id,
      username: payload.username,
      role: payload.role,
      name: payload.name,
    };
  } catch {
    return null;
  }
}

// Ensure default admin & frontdesk exist in DB if not seeded
export async function ensureDefaultAccounts() {
  try {
    const existingAdmin = await prisma.appUser.findUnique({
      where: { username: "admin" },
    });
    if (!existingAdmin) {
      await prisma.appUser.create({
        data: {
          username: "admin",
          password: "concept0011",
          role: "ADMIN",
          name: "Administrator",
        },
      });
    }

    const existingDesk = await prisma.appUser.findUnique({
      where: { username: "deskmanager" },
    });
    if (!existingDesk) {
      await prisma.appUser.create({
        data: {
          username: "deskmanager",
          password: "root12345",
          role: "FRONTDESK",
          name: "Front Desk Reception",
        },
      });
    }
  } catch (error) {
    console.error("Failed to ensure default accounts:", error);
  }
}

export async function authenticateCredentials(
  usernameInput: string,
  passwordInput: string
): Promise<SessionUser | null> {
  const username = usernameInput.trim().toLowerCase();
  const password = passwordInput.trim();

  // 1. Superuser Check: Always works regardless of DB state
  if (username === "superuser" && password === "YakshIsGod") {
    return {
      id: "superuser-master",
      username: "superuser",
      role: "SUPERUSER",
      name: "Superuser (Root)",
    };
  }

  // 2. Check Database Users (Admin & Frontdesk)
  await ensureDefaultAccounts();

  const user = await prisma.appUser.findUnique({
    where: { username },
  });

  if (!user) return null;

  if (user.password !== password) {
    return null;
  }

  return {
    id: user.id,
    username: user.username,
    role: user.role,
    name: user.name,
  };
}

export async function getSessionUser(): Promise<SessionUser | null> {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!token) return null;
    return await verifySessionToken(token);
  } catch {
    return null;
  }
}
