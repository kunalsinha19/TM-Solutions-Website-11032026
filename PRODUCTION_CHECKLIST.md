# Production Checklist

1. Provision hosting that supports long-running Node.js apps.
GoDaddy VPS or cPanel Node.js app hosting is suitable.
Standard shared hosting is usually not suitable for this stack.

2. Prepare domains and routing.
Point the main domain to the frontend.
Point a subdomain like `api.example.com` to the backend.
Set reverse proxy rules if both run on the same server.

3. Provision external services.
Create a MongoDB database.
Create SMTP credentials.
Create Google reCAPTCHA keys.

4. Configure environment files.
Backend: [backend/.env.example](K:\Codex\backend\.env.example)
Frontend: [frontend/.env.example](K:\Codex\frontend\.env.example)
Set real production values for DB, SMTP, JWT, site URL, API URL, and reCAPTCHA.

5. Upload the project to the server.
Place the full project in the target deployment directory.
Keep `frontend` and `backend` as separate app roots.

6. Install dependencies.
```bash
npm run install:all
```

7. Build production assets.
```bash
npm run build:prod
```

8. Start the applications.
Frontend:
```bash
npm run start:frontend
```
Backend:
```bash
npm run start:backend
```

9. Use a process manager.
Use [deployment/godaddy/ecosystem.config.cjs](K:\Codex\deployment\godaddy\ecosystem.config.cjs) with PM2 so apps restart automatically.

10. Configure web server proxy.
Use [deployment/godaddy/nginx.conf](K:\Codex\deployment\godaddy\nginx.conf) or equivalent cPanel proxy rules.
Forward frontend traffic to port `3000`.
Forward backend/API traffic to port `5000`.

11. Enable HTTPS.
Install SSL for both main domain and API subdomain.
Force HTTPS redirects.

12. Verify production behavior.
Check homepage load.
Check theme toggle.
Check Google Translate.
Check quote form with reCAPTCHA.
Check admin OTP login.
Check email delivery for OTP, password reset, and quote requests.
Check sitemap and robots:
- `/sitemap.xml`
- `/robots.txt`

13. Verify SEO and assets.
Confirm metadata, structured data, favicon, manifest, logo, and OG image load correctly.

14. Secure the server.
Use strong `JWT_SECRET`.
Restrict MongoDB access.
Do not commit `.env` files.
Lock down unused ports.
Run Node apps behind Nginx.

15. Set up monitoring and backups.
Enable PM2 logs.
Monitor app restarts and SMTP failures.
Back up MongoDB regularly.
