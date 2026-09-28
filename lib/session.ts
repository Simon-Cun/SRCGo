export const SESSION_COOKIE = 'srcgo_session';
export const DEMO_TOKEN = 'DEMO_TOKEN_12345';

export function buildSessionCookie(token: string): string {
  return [
    `${SESSION_COOKIE}=${token}`,
    'HttpOnly',
    'SameSite=Strict',
    'Secure',
    'Path=/api',
    'Max-Age=3600',
  ].join('; ');
}

export function clearSessionCookie(): string {
  return `${SESSION_COOKIE}=; HttpOnly; SameSite=Strict; Secure; Path=/api; Max-Age=0`;
}
