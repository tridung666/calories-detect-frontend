# API Conventions

Backend:

Spring Boot

Communication:

REST API

---

## Response Format

Every endpoint returns:

```json
{
  "code": 200,
  "message": "Success",
  "data": {}
}
```

Never assume raw JSON.

Always extract:

response.data.data

---

## Authentication

JWT Bearer Token

Authorization header:

Bearer <access_token>

Access tokens are memory-only. Never persist authentication tokens in browser storage.
Refresh tokens are sent only by the API-owned HttpOnly, SameSite=Lax cookie.
Use credentials on all Axios requests. Login, Google login, refresh and logout
require X-XSRF-TOKEN from GET /auth/csrf. Refresh and logout send no JSON body.
See [the auth contract](./auth-api-sync.md).

---

## Axios

Only one Axios instance.

Location:

src/lib/axios.ts

Never create multiple Axios clients.

---

## Query

Use TanStack Query.

Query Keys should follow:

["foods"]

["foods", foodId]

["profile"]

["dashboard"]

---

## Mutations

After successful mutation,
invalidate affected queries.

Example:

- Create Food
- Update Food
- Delete Food

↓

invalidate ["foods"]

---

## Pagination

Backend uses:

page

size

Response:

{
"content": [],
"page": 0,
"size": 10,
"totalElements": 100,
"totalPages": 10
}

Never hardcode pagination.

---

## Errors

Handle:

400

401

403

404

409

500

Show friendly messages to users.
