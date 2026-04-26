# Receipt Reward SaaS MVP

Gamified receipt-based reward platform for cafes/restaurants/bars.

## Monorepo Structure
- `apps/api`: NestJS backend API (receipt validation, fraud checks, reward engine, coupon redeem)
- `apps/web`: Next.js frontend (receipt submit + scratch demo flow)
- `apps/worker`: BullMQ worker (OCR job placeholder)
- `packages/shared`: shared TS types
- `db`: SQL migration + seed

## Quick Start
1. Copy env file:
   - `cp .env.example .env`
2. Start stack:
   - `docker compose up`
3. Open:
   - Web: `http://localhost:3000`
   - API health: `http://localhost:4000/health`

## Core Endpoints
- `POST /receipts/upload`
- `POST /receipts/:id/validate`
- `POST /games/spin`
- `POST /games/scratch/reveal`
- `POST /coupons/:id/redeem`
- `GET /business/:id/dashboard/metrics`
- `POST /business/:id/reward-rules`

## Fraud Rules (MVP)
- Receipt must be within `RECEIPT_WINDOW_MINUTES`
- Minimum amount `MIN_RECEIPT_AMOUNT`
- Duplicate fingerprint blocked
- Duplicate image hash blocked
- Daily play limit `DAILY_PLAY_LIMIT`

## Notes
- API now supports PostgreSQL-backed persistence when `DATABASE_URL` is configured.
- If no `DATABASE_URL` is provided, the app falls back to in-memory storage for rapid local prototyping.
- Worker currently contains mock OCR parsing output.
