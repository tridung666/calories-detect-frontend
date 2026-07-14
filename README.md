# Calories Detect Frontend

React and TypeScript frontend built with Vite and served by Nginx in production.

## API routing

The browser uses the same-origin `/api` prefix. The public reverse proxy must
forward `/api/` to the Spring Boot service while removing that prefix.

```nginx
location /api/ {
    proxy_pass http://127.0.0.1:8080/;
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

Vite proxies `/api/*` to `API_PROXY_TARGET` and removes `/api`, matching the
production reverse-proxy behavior.

## Verification

```bash
npm run lint
npm run build
docker build --build-arg VITE_API_BASE_URL=/api -t calories-detect-frontend .
```
