# Calories Detect Frontend

React and TypeScript frontend built with Vite and served by Nginx in production.

## API routing

The browser uses the same-origin `/api` prefix. The Nginx runtime forwards
`/api/*` to the Spring Boot Docker Compose service named `backend` on port
`8080`, preserving the complete request path.

```nginx
location /api/ {
    proxy_pass http://backend:8080$request_uri;
}
```

`VITE_API_BASE_URL` defaults to `/api`. It can be overridden at image build
time, but it must be a public browser URL rather than the container's backend
address.

## Local development

Copy `.env.example` to `.env`, then run:

```bash
npm ci
npm run dev
```

Vite proxies `/api/*` to `API_PROXY_TARGET` while preserving `/api`, matching
the production Nginx behavior and the backend endpoint paths.

## Languages

English and Vietnamese are available from the language selector on the sign-in
screen and app header. The app remembers the selection and uses the browser's
supported language on the first visit, with Vietnamese as the default.

UI copy, validation, and API error messages live in `src/locales`, grouped by
feature. See [the localization guide](docs/i18n.md) for conventions and how to
add another language without changing UI components.

## Verification

```bash
npm run lint
npm run test
npm run build
npm run test:e2e
docker build --build-arg VITE_API_BASE_URL=/api -t calories-detect-frontend .
```
