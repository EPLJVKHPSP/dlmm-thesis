import { createHmac, timingSafeEqual } from "node:crypto";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { databaseClient } from "./data-repository";

const COOKIE = "dlmm_thesis_session";
const REVIEW_EMAIL = "reviewer@dlmm.local";
const REVIEW_PASSWORD = "review-access";

export type Session = {
  id: string;
  email: string;
  name: string;
  role: string;
};

function signingKey() {
  return process.env.DLMM_SESSION_KEY || "local-review-key-not-for-live-use";
}

function signature(payload: string) {
  return createHmac("sha256", signingKey()).update(payload).digest("base64url");
}

function safeEqual(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function authenticate(email: string, password: string): Promise<Session | null> {
  const normalized = email.trim().toLowerCase();
  const sql = databaseClient();
  if (sql) {
    try {
      const rows = await sql`select id, email, password_hash, display_name, role from app_user where lower(email) = ${normalized} and active = true limit 1`;
      if (rows.length && await bcrypt.compare(password, String(rows[0].password_hash))) {
        return { id: String(rows[0].id), email: String(rows[0].email), name: String(rows[0].display_name), role: String(rows[0].role) };
      }
      return null;
    } catch {
      // Local review mode falls back to the same public account.
    }
  }
  if (!safeEqual(normalized, REVIEW_EMAIL) || !safeEqual(password, REVIEW_PASSWORD)) return null;
  return { id: "REVIEWER-01", email: REVIEW_EMAIL, name: "Thesis Reviewer", role: "reviewer" };
}

export async function startSession(user: Session) {
  const payload = Buffer.from(JSON.stringify(user)).toString("base64url");
  const value = `${payload}.${signature(payload)}`;
  const store = await cookies();
  store.set(COOKIE, value, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.DLMM_SECURE_COOKIE === "true",
    path: "/",
    maxAge: 60 * 60 * 4,
  });
}

export async function readSession(): Promise<Session | null> {
  const store = await cookies();
  const value = store.get(COOKIE)?.value;
  if (!value) return null;
  const [payload, supplied] = value.split(".");
  if (!payload || !supplied || !safeEqual(supplied, signature(payload))) return null;
  try {
    return JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  } catch {
    return null;
  }
}

export async function requireSession() {
  const session = await readSession();
  if (!session) redirect("/login");
  return session;
}

export async function endSession() {
  const store = await cookies();
  store.delete(COOKIE);
}
