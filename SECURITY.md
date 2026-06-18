# Zashly Security Documentation

Enterprise-grade security layer for the Zashly real-time chat application.

## Security folder structure

```
backend/src/
├── config/security/       # env validation, CORS, cookies
├── middleware/security/   # helmet, rate limits, errors, validation
├── validators/            # Joi schemas per route
├── utils/security/        # tokens, sanitization, client IP
├── uploads/security/      # file type / magic-byte validation
├── socket/security/       # JWT socket auth, rate limits, room guards
├── monitoring/            # Winston logging
└── services/              # auth session / refresh token lifecycle
```

## Middleware flow (request lifecycle)

1. **HTTPS redirect** (production)
2. **Helmet** — security headers, HSTS, CSP
3. **Compression** — gzip
4. **Morgan → Winston** — request audit log
5. **Global rate limit** — 500 req / 15 min / IP
6. **CORS** — whitelist origins only (no `*`)
7. **Body parser** — 10MB cap (reduced from 100MB)
8. **Cookie parser**
9. **express-mongo-sanitize** — blocks `{$gt: ""}` operator injection
10. **HPP** — parameter pollution protection
11. **Route validators** (Joi) + **route rate limits**
12. **protectRoute** — JWT from httpOnly cookie + token version check
13. **Controller**
14. **notFoundHandler** → **errorHandler** — no stack traces in production

## Authentication

| Feature | Implementation |
|--------|----------------|
| Password hashing | bcrypt (10 rounds) via User pre-save |
| Access token | JWT in httpOnly cookie `jwt`, ~15 min |
| Refresh token | JWT in httpOnly cookie `refreshToken`, path `/api/auth` |
| Logout all devices | `POST /api/auth/logout-all` increments `tokenVersion` |
| Brute force | 5 failed logins → 15 min lock (`lockUntil`) |
| Rate limits | login 5/15min, auth 20/15min |
| Email verify | OTP via `EmailVerification` model (`ENABLE_EMAIL_VERIFICATION=true`) |
| Session list | `GET /api/auth/sessions` |

### HIGH-RISK fixes applied

- **Password in API responses** — `toJSON` transform strips password
- **Onboard mass assignment** — `...req.body` replaced with field whitelist (blocked `role` escalation)
- **Socket impersonation** — `user-online` must match JWT user
- **Unauthorized group join** — `join-group` checks membership in DB
- **Upload malware** — magic-byte validation + extension blocklist

## Socket.IO security

- JWT required in handshake cookie before connection
- Per-event rate limiting (messages, typing throttle)
- `group-message` sender must match authenticated socket user
- Message text sanitized server-side

## File uploads

- Allowed: jpeg, png, webp, gif, mp4, webm, mov
- Blocked: exe, bat, php, sh, html, js, etc.
- Random filenames + `safeUploadPath()` anti-traversal
- Static `/uploads` with `dotfiles: deny`, `X-Content-Type-Options: nosniff`

## Environment variables

Copy `backend/.env.example` → `backend/.env`. Never commit:

- `JWT_SECRET`, `JWT_REFRESH_SECRET`
- `MONGO_URI`
- `STREAM_API_SECRET`

Generate secrets:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

## Installed packages (backend)

`helmet`, `hpp`, `joi`, `express-mongo-sanitize`, `validator`, `winston`, `morgan`, `compression`, `xss`, `uuid`, `express-rate-limit`, `bcryptjs`, `jsonwebtoken`, `cookie-parser`

## Production deployment checklist

- [ ] Set `NODE_ENV=production`
- [ ] `JWT_SECRET` and `JWT_REFRESH_SECRET` ≥ 32 chars, unique
- [ ] MongoDB Atlas with IP allowlist + TLS (`mongodb+srv://`)
- [ ] `CLIENT_URLS` set to real frontend domain(s)
- [ ] `TRUST_PROXY=true` behind NGINX/Cloudflare
- [ ] TLS certificates (Let's Encrypt)
- [ ] Deploy NGINX config from `deploy/nginx/zashly.conf`
- [ ] PM2 or Docker (`deploy/pm2`, `deploy/docker`)
- [ ] Enable Cloudflare DDoS / WAF
- [ ] Firewall: expose only 443 (and 80 for redirect)
- [ ] Run `npm audit` in backend and frontend
- [ ] Rotate secrets periodically
- [ ] Backup MongoDB on schedule
- [ ] Review `logs/security.log` for failed logins

## Attack prevention summary

| Attack | Prevention |
|--------|------------|
| XSS | xss + validator.escape, Helmet CSP, client escapeHtml |
| NoSQL injection | express-mongo-sanitize |
| Brute force | login rate limit + account lock |
| Session hijacking | httpOnly cookies, short JWT, tokenVersion |
| CSRF | SameSite=strict cookies (no localStorage tokens) |
| Socket spam | SocketRateLimiter + message limiter |
| Malware upload | MIME whitelist + magic bytes |
| Path traversal | safeUploadPath + basename |
| DDoS | global rate limit + Cloudflare-ready proxy headers |
| Info leakage | centralized error handler |
| IDOR (groups) | canJoinGroup middleware |

## Frontend security

- Auth via **httpOnly cookies only** (axios `withCredentials: true`)
- Auto token refresh on `TOKEN_EXPIRED`
- No JWT in localStorage
- `escapeHtml` / `sanitizeHref` utilities for custom UI
- Signup password: 8+ chars, upper, lower, number

## Security audit commands

```bash
cd backend && npm audit
cd frontend && npm audit
```

## Reporting vulnerabilities

Report security issues privately to the project maintainer — do not open public issues with exploit details.
