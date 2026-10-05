# Auth frontend integration — 2026-09-24

This guide describes the cookie-based contract. The backend OpenAPI endpoint
(`/v3/api-docs` in local development) is the source for current request/response schemas.

## Configuration and response handling

Use `VITE_API_BASE_URL=/api` with the Vite proxy (`API_PROXY_TARGET=http://localhost:8080`).
For direct backend requests, use the full API prefix, e.g.
`VITE_API_BASE_URL=http://localhost:8080/api`. Configure `VITE_GOOGLE_CLIENT_ID`
to match the backend Google client ID. Deployment origins must be allowed by backend CORS.

Auth mutations use the single Axios client with `withCredentials: true`.
Login and Google login send JSON; refresh and logout send no body.
`GET /auth/csrf` supplies the masked token for `X-XSRF-TOKEN` on those four cookie
operations. The CSRF cookie is HttpOnly on the API host. `ApiResponse<T>`
is a success/error union; API functions expect `ApiSuccessResponse<T>` after the
client rejects unsuccessful envelopes. Errors are mapped by application code,
with HTTP fallbacks for security responses that have empty or nonstandard bodies.

| Path after `/api`               | JSON fields                              | Bearer required | Success data   |
| ------------------------------- | ---------------------------------------- | --------------- | -------------- |
| `/auth/register`                | email, password, fullName                | No              | RegisteredUser |
| `/auth/verify-email`            | email, otp                               | No              | string         |
| `/auth/resend-otp`              | email                                    | No              | string         |
| `/auth/login`                   | email, password                          | No              | AccessToken    |
| `/auth/google`                  | idToken                                  | No              | AccessToken    |
| `/auth/forgot-password`         | email                                    | No              | string         |
| `/auth/reset-password`          | email, otp, newPassword, confirmPassword | No              | string         |
| `/auth/change-password/request` | currentPassword                          | Yes             | string         |
| `/auth/google/link`             | idToken                                  | Yes             | string         |
| `/auth/set-password`            | newPassword, confirmPassword             | Yes             | string         |
| `/auth/refresh-token`           | none (cookie + CSRF)                     | No              | AccessToken    |
| `/auth/logout`                  | none (cookie + CSRF)                     | No              | string         |

## Registration, login, and OTP

- Registration uses the canonical `data.email` returned by the backend for the
  verification screen. Registration and verification never create a session.
  Registering again before verification keeps the original name/password;
  the registration copy explains this behavior.
- Successful verification opens login with the email prefilled. Login error
  11005 opens verification without automatically requesting a code. Resending
  verification codes uses `/auth/resend-otp`.
- Resend and forgot-password success messages describe conditional delivery.
  HTTP 200 does not prove that a new code was delivered. Existing OTP input is
  preserved on resend so users may still submit a code they already have.
- Verification and password OTPs use separate cooldown keys. Forgot/change
  password share their password cooldown and both confirm via `/auth/reset-password`.
- Change-password requests send only the current password. After success it is
  cleared from form memory; resend uses `/auth/forgot-password` with the profile
  email. No current password is retained to enable resend.
- OTP stays a six-digit string. Validation preserves leading zeroes and supports
  paste and keyboard entry. Timers are advisory and never claim exact server
  expiry or remaining-attempt data. Email/name are trimmed; passwords are not.
- New passwords require 8–72 characters, at most 72 UTF-8 bytes, non-whitespace
  content, and exact confirmation. Errors 11002/11003/11006/11012 appear at fields.
- Password/OTP action mutations have zero garbage-collection time and clear
  request variables after settling. Secrets are never written to URLs or browser storage.

## Account actions

- The header's settings gear opens `/settings`, which displays change password,
  set first password, and link Google. `/profile` displays personal information
  and avatar upload. `/settings/change-password` opens the dedicated password
  flow; `/profile/change-password` redirects there for existing links.
  The profile API has no provider metadata. The UI never infers providers from
  the last login method and does not request nonexistent provider APIs.
- Set password sends only newPassword/confirmPassword; it requires no OTP or
  current password. Success clears the matching session and opens prefilled login.
  Error 11013 offers change password; error 11009 in the change flow points to
  setting the first password.
- Linking sends the Google ID token as JSON with the application's Bearer token.
  Google tokens are checked for nonempty content and the 8192-character limit.
  The UI asks users to choose the Google account matching their profile email.
  Link error 11007 gets a context-specific message; success preserves the existing
  session and invalidates profile data. Only a successful link creates a local
  linked-success indication; it is not persisted as inferred provider metadata.
- Google login error 11007 directs users to their existing sign-in method and
  the account linking screen. No automatic registration, linking, or set-password
  request is used to bypass this conflict.

## Sessions, refresh, and logout

- JSON token responses contain only `accessToken`, `tokenType`, and `expiresIn`.
  Access tokens and expiration timestamps exist only in module memory. Startup,
  login and logout remove `accessToken`, `refreshToken`, and `calories-detect:tokens`
  from both localStorage and sessionStorage. Existing persistent-token sessions
  must sign in again once; their refresh tokens are never migrated into JS.
- The API owns a host-only HttpOnly refresh cookie at `/api/auth`, SameSite=Lax.
  Production uses `__Secure-calories_refresh`, Secure=true on
  `https://api.caloriesdetect.com`. Do not set Domain=.caloriesdetect.com: the
  frontend sends the cookie to the API with credentials without reading it.
  Local HTTP uses `calories_refresh`, Secure=false. Use the Vite `/api` proxy or
  the same hostname on both localhost ports; do not mix localhost with 127.0.0.1.
- Production CORS allows only the exact HTTPS frontend origin, credentials, and
  required headers including Authorization, Content-Type and X-XSRF-TOKEN.
  Local origins are configured separately. CORS must never use wildcard origins
  with credentials. SameSite is defense in depth, not a replacement for CSRF.
- `SessionBoundary` calls refresh before mounting routes, including after reload.
  Rejected refresh credentials yield a signed-out session. Network/5xx/CSRF
  failures show a retry state rather than assuming the user signed out.
- Access expiry schedules a refresh 30 seconds early; requests also check expiry
  before sending and retry a protected HTTP 401 at most once. Public auth calls
  never enter a refresh loop. Transient refresh failures retain session state.
- Same-tab refreshes share one promise. Web Locks serialize refresh, login,
  Google login and logout across tabs. Each tab refreshes its own memory token
  using the latest cookie; tokens are never shared through persistent storage.
- Logout clears access and the complete TanStack Query cache immediately. The
  logout HTTP request waits behind any pending cookie rotation and revokes the
  newest cookie. Session versions prevent late responses from restoring access
  or publishing data from a previous account. Backend logout is idempotent and
  clears the cookie with matching name/path/security attributes.
- BroadcastChannel and a token-free localStorage event propagate logout. Cache
  clearing follows session version changes in every mounted tab.
- Network failure during logout is reported: local state is cleared, but only a
  successful backend request can guarantee revocation/cookie deletion. An
  unreachable server can leave its HttpOnly cookie usable after a later reload.
- Reset/set password preserve their existing OTP and account-matching behavior:
  clear only the affected signed-in account, including other tabs. Backend token
  revocation prevents restoring that account after reload. Linking Google keeps
  the existing session and refresh cookie.

## Validation and limits

`npm run lint`, `npm run build`, `npm run format:check`, unit tests, and Playwright
cover API bodies/Bearer rules, public failures, token rotation, concurrency,
logout, registration/verification, account actions, validation, error recovery,
translations, mobile layout, and existing application features.

Browser tests mock Google Identity and backend responses. Real Google linking,
SMTP delivery, backend OTP limits and server-side token revocation still require
an integration environment. Cross-tab cookie coordination requires Web Locks
(secure contexts, including localhost); without it the fallback only deduplicates
within a tab. Concurrent tabs on unsupported browsers can force a fresh sign-in
when the backend correctly rejects reuse of a rotated token.
