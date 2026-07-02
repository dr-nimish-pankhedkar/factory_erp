const USERNAME_PATTERN = /^[a-z0-9._-]{3,30}$/;

export function normalizeUsername(input: string): string {
  return input.trim().toLowerCase();
}

export function isValidUsername(username: string): boolean {
  return USERNAME_PATTERN.test(username);
}

// Supabase Auth requires an email identifier for password-based login;
// this synthetic address is never emailed anywhere, it's purely an
// internal identifier so username+PIN can use email+password auth.
export function usernameToAuthEmail(username: string): string {
  return `${normalizeUsername(username)}@users.millapp.internal`;
}
