# GoDaddy Deployment

This project is prepared for GoDaddy Linux hosting with Node.js support or a VPS/cPanel setup.

## Recommended layout

- Frontend on main domain: `https://www.example.com`
- Backend on subdomain: `https://api.example.com`
- MongoDB hosted externally, because standard GoDaddy shared hosting does not provide MongoDB

## Environment files

- Copy `frontend/.env.example` to `frontend/.env.production`
- Copy `backend/.env.example` to `backend/.env`

## Install

```bash
npm run install:all
```

## Build

```bash
npm run build:prod
```

## Production start

Frontend:
```bash
cd frontend
npm run start:prod
```

Backend:
```bash
cd backend
npm run start:prod
```

## GoDaddy notes

- If using cPanel Node.js app manager, point the frontend app to the `frontend` directory and run `npm run build` first.
- Set the backend as a separate Node.js app, ideally on a subdomain.
- For Next.js, `output: "standalone"` is enabled in `frontend/next.config.js`.
- Configure your domain proxy so the frontend serves the main site and the backend serves `/api` from a subdomain or reverse proxy.
- If GoDaddy hosting does not allow long-running Next.js processes, deploy the frontend to a VPS or use static export only after removing dynamic features.
- MongoDB, SMTP, and reCAPTCHA credentials must be provided through the GoDaddy environment configuration panel.
