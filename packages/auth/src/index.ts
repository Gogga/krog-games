// Placeholder - will be populated from server/src/auth/index.ts
export const AUTH_PLACEHOLDER = true;

// JWT utilities will be moved here
export interface JWTPayload {
  userId: string;
  username: string;
  iat?: number;
  exp?: number;
}

// Auth middleware will be moved here
export interface AuthRequest {
  user?: JWTPayload;
}
