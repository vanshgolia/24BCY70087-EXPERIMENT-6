# Experiment 2.2.1 — Middleware Implementation (Logging & Auth)

**Course Outcomes:** CO3, CO4  
**Tech Stack:** Node.js · Express.js · MongoDB · JWT

---

## Setup

```bash
cd exp-2.2.1-middleware
npm install
# Edit .env if needed (MongoDB URI, JWT secret)
npm run dev
```

---

## Middleware Chain

```
Request → logger.js → verifyToken (protected only) → Route Handler → errorHandler.js → Response
```

---

## Testing with Postman / curl

### 1. Health Check (Public)
```bash
curl http://localhost:3000/api/public/health
```

### 2. Get Demo JWT
```bash
curl -X POST http://localhost:3000/api/public/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@bank.com","password":"password123"}'
```

### 3. Access Protected Route (use token from step 2)
```bash
curl http://localhost:3000/api/protected/dashboard \
  -H "Authorization: Bearer <your_token_here>"
```

### 4. Access Without Token (expect 401)
```bash
curl http://localhost:3000/api/protected/dashboard
```

### 5. Trigger Error Handler
```bash
curl http://localhost:3000/api/public/error
```

---

## Expected Outputs

| Endpoint | Auth | Expected Status |
|---|---|---|
| GET /api/public/health | None | 200 OK |
| POST /api/public/login | None | 200 OK with token |
| GET /api/protected/dashboard | Valid JWT | 200 OK |
| GET /api/protected/dashboard | No token | 401 Unauthorized |
| GET /api/protected/dashboard | Bad token | 403 Forbidden |
| GET /api/public/error | None | 500 Server Error |

Console shows request logs for every request:
```
[2024-01-01T12:00:00.000Z] GET /api/protected/dashboard | Status: 200 | 5ms | IP: ::1
```
