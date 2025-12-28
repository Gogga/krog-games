// Placeholder - will be populated from server/src/db/index.ts
export const DB_PLACEHOLDER = true;

// Database client configuration
export interface DatabaseConfig {
  connectionString: string;
}

// Database module exports will be moved here
export interface DatabaseModule {
  users: unknown;
  games: unknown;
  friends: unknown;
  clubs: unknown;
  tournaments: unknown;
  leagues: unknown;
}
