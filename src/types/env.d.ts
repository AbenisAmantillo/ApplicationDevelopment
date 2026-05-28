declare module '@env' {
  /** Symfony API origin (no trailing slash). Set in `.env.local`. */
  export const API_BASE_URL: string | undefined;
  /** Optional alias for web-style env naming. */
  export const VITE_API_BASE_URL: string | undefined;
  /** Optional alias for Next.js-style env naming. */
  export const NEXT_PUBLIC_API_BASE_URL: string | undefined;
  /** Firebase web client ID used by Google Sign-In. */
  export const GOOGLE_WEB_CLIENT_ID: string | undefined;
  /** Optional WebSocket origin (e.g. `wss://api.example.com`). Derived from API URL when unset. */
  export const WS_BASE_URL: string | undefined;
  /** WebSocket path on the origin (default `/ws`). */
  export const WS_PATH: string | undefined;
}
