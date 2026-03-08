# Architecture Notes

## Frontend

- App Router based Next.js application with route groups for public and admin surfaces.
- Tailwind CSS variables drive light/dark theming.
- Framer Motion powers hero transitions and the roulette-style product reel.
- SEO landing pages render typed sections from backend content.

## Backend

- Express API organized by feature module.
- Mongoose models define MongoDB collections and indexes.
- OTP login is admin-only and token based.
- Quote requests are persisted and routed through a notification service abstraction.
