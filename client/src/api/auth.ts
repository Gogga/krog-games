// Use environment variable in production, fall back to same-host for development
const getApiBase = () => {
  if (import.meta.env.VITE_API_URL) {
    return `${import.meta.env.VITE_API_URL}/api`;
  }
  const host = window.location.hostname;
  return `http://${host}:3000/api`;
};
const API_BASE = getApiBase();

export interface User {
  id: string;
  username: string;
  email: string;
  rating: number;
  games_played: number;
  games_won: number;
  games_drawn: number;
  games_lost: number;
  created_at: string;
  last_login: string | null;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  user?: User;
  token?: string;
}

export interface LeaderboardEntry {
  id: string;
  username: string;
  rating: number;
  games_played: number;
  games_won: number;
}

export interface Game {
  id: string;
  room_code: string;
  white_id: string | null;
  black_id: string | null;
  white_username?: string;
  black_username?: string;
  pgn: string | null;
  result: string | null;
  time_control: string | null;
  white_rating_before: number | null;
  black_rating_before: number | null;
  white_rating_change: number | null;
  black_rating_change: number | null;
  started_at: string;
  ended_at: string | null;
}

// Store token in localStorage
const TOKEN_KEY = 'krog-auth-token';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function removeStoredToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

// API functions
export async function register(username: string, email: string, password: string): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, email, password })
  });
  return response.json();
}

export async function login(usernameOrEmail: string, password: string): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ usernameOrEmail, password })
  });
  return response.json();
}

export async function getCurrentUser(): Promise<AuthResponse> {
  const token = getStoredToken();
  if (!token) {
    return { success: false, message: 'No token' };
  }

  const response = await fetch(`${API_BASE}/auth/me`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return response.json();
}

export async function refreshToken(): Promise<AuthResponse> {
  const token = getStoredToken();
  if (!token) {
    return { success: false, message: 'No token' };
  }

  const response = await fetch(`${API_BASE}/auth/refresh`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return response.json();
}

export async function getUserProfile(userId: string): Promise<{ success: boolean; user?: User; recentGames?: Game[]; ratingHistory?: { rating: number; rating_change: number; created_at: string }[] }> {
  const response = await fetch(`${API_BASE}/profile/${userId}`);
  return response.json();
}

export async function getLeaderboard(limit: number = 100): Promise<{ success: boolean; leaderboard: LeaderboardEntry[] }> {
  const response = await fetch(`${API_BASE}/leaderboard?limit=${limit}`);
  return response.json();
}

export async function getUserGames(userId: string, limit: number = 20, offset: number = 0): Promise<{ success: boolean; games: Game[] }> {
  const response = await fetch(`${API_BASE}/games/${userId}?limit=${limit}&offset=${offset}`);
  return response.json();
}
