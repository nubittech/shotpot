# Gamified Receipt-Based Reward System (Web SaaS)

Build an MVP for a **Gamified Receipt-Based Reward System (Web SaaS)** for cafes/restaurants/bars.

## Product Goal
Increase repeat visits via instant gamified rewards after purchases, without POS integration.

## Core User Flow
QR/link -> web app -> "Sansini Dene" -> receipt photo capture -> OCR parse -> validation/fraud checks -> eligible spin/scratch right -> play game -> result -> digital coupon.

## Mandatory Architecture
- Frontend: Next.js (mobile-first, camera access, PWA-friendly UX)
- Backend: Node.js + NestJS (REST API)
- DB: PostgreSQL
- Cache/limits: Redis
- Queue/Workers: BullMQ (OCR + async validations)
- Storage: S3-compatible object storage for receipt images

## Required Modules
1. Auth & tenancy (Business, Branch, User)
2. Receipt intake + OCR pipeline
3. Fraud prevention engine
4. Reward engine (server-authoritative outcomes)
5. Game presentation layer (slot + scratch UI as renderer only)
6. Coupon issuance/redeem flow
7. Business dashboard (reward rules, win rates, analytics)

## OCR Pipeline
- Preprocess image (rotation/contrast/denoise)
- OCR extraction
- Entity parse: business_name, date, time, total_amount
- Confidence scoring + normalization
- Persist raw + structured JSON

## Fraud Rules (MVP)
- Receipt timestamp must be within last 2 hours
- Receipt fingerprint hash: business_name+date+time+total_amount (single-use)
- Image perceptual hash dedupe
- Per-user/day play limit (+IP/device soft limit)
- Minimum spend threshold
- Idempotent submission handling

## Reward Engine Rules
- Backend decides outcome, frontend never generates true random outcome
- Weighted reward probabilities per business
- "No reward" supported
- Optional jackpot item (3 logo match) with separate animation flag
- Return signed outcome payload with expiry

## Game UI (MVP scope)
- Scratch card first (canvas + destination-out + completion threshold e.g. 50%)
- Slot module behind feature flag (later)
- Dynamic config-driven theming per business:
  - logo, background, palette, fonts, reward icons, localized messages

## Data Model (minimum tables)
- users
- businesses
- branches
- receipts
- receipt_hashes
- spins
- rewards
- coupons
- audit_logs

## API Endpoints (minimum)
- POST /receipts/upload
- POST /receipts/:id/validate
- POST /games/spin
- POST /games/scratch/reveal
- POST /coupons/:id/redeem
- GET /business/dashboard/metrics
- POST /business/reward-rules

## Security & Reliability
- JWT auth + role-based access (admin/staff/customer)
- Rate limiting + abuse detection
- Signed URLs for uploads
- Structured audit logs
- Observability: request IDs, worker metrics, OCR latency, fraud reject reasons

## Analytics (MVP)
- participation rate
- validation pass/fail ratio
- reward distribution
- redemption rate
- repeat visit proxy (same user over time window)

## Deliverables
1. Monorepo structure (frontend/backend/shared)
2. Docker Compose for local stack (postgres/redis/minio/api/web/worker)
3. SQL migrations + seed data
4. Working end-to-end demo flow
5. README with setup, env vars, architecture diagram, and API examples
6. Basic test coverage for fraud rules and reward determinism

## Implementation Priority
Phase 1: Receipt upload + OCR + validation + coupon issue (no slot, scratch only)  
Phase 2: Dashboard + configurable reward rules  
Phase 3: Slot lever interaction + jackpot mode + richer analytics

Output production-grade code with clear module boundaries and pragmatic defaults.
