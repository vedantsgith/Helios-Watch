/**
 * Auth Service — Helios-Watch Frontend
 *
 * API calls for user authentication (register, login, logout, session check).
 * All calls use the shared axios instance with credentials for httpOnly cookie support.
 */

import api from "./api";
import type { User } from "../types";

export interface AuthPayload {
  email: string;
  password: string;
}

export interface AuthResult {
  message: string;
  user: User;
}

/**
 * Register a new account.
 * Sets httpOnly JWT cookie on success.
 */
export async function register(email: string, password: string): Promise<AuthResult> {
  const res = await api.post<AuthResult>("/api/auth/register", { email, password });
  return res.data;
}

/**
 * Log in with email + password.
 * Sets httpOnly JWT cookie on success.
 */
export async function login(email: string, password: string): Promise<AuthResult> {
  const res = await api.post<AuthResult>("/api/auth/login", { email, password });
  return res.data;
}

/**
 * Log out (clears the auth cookie server-side).
 */
export async function logout(): Promise<void> {
  await api.post("/api/auth/logout");
}

/**
 * Check current session. Returns the logged-in user or throws 401.
 */
export async function getMe(): Promise<User> {
  const res = await api.get<User>("/api/auth/me");
  return res.data;
}

export interface UserPreferences {
  email_alerts_enabled: boolean;
  alert_min_status: string;
}

export async function fetchPreferences(): Promise<UserPreferences> {
  const res = await api.get<UserPreferences>("/api/auth/preferences");
  return res.data;
}

export async function savePreferences(prefs: UserPreferences): Promise<UserPreferences> {
  const res = await api.post<UserPreferences>("/api/auth/preferences", prefs);
  return res.data;
}
