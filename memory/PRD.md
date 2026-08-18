# ABYNS KOS — AI Property Operating System

## Original Problem
Competition prototype for a premium Indonesian boarding-house (kos) AI OS. Landing page + full owner dashboard with AI insight/assistant, mock relational data, no external prod integrations.

## Stack
- Backend: FastAPI + MongoDB (modeled with foreign-key style UUIDs for easy CI4/MySQL migration later).
- Frontend: React 19 + react-router-dom + recharts + lucide-react. Manual CSS (no Tailwind, no shadcn) using CSS variables. Fonts: Fraunces (display) + Manrope (UI).
- AI: Gemini 3 Flash via Emergent LLM key + SSE streaming.

## Endpoints (/api/v1)
- GET /health, /dashboard, /properties, /properties/{id}, /rooms, /tenants, /tenants/{id}, /invoices, /maintenance, /finance/summary, /expenses, /notifications
- POST /ai/chat (SSE stream)

## Pages
- / (Landing), /dashboard, /properties, /properties/:id, /tenants, /tenants/:id, /billing, /maintenance, /finance, /ai

## Implemented
- Full seed with 24 rooms, 19 tenants, contracts, past+current invoices, payments, maintenance, expenses, notifications.
- Owner dashboard with KPI, Property Health circular score, AI insight card, occupancy donut, revenue area chart, payment overview donut, upcoming/overdue lists, activity feed.
- Live streaming AI assistant.
- Fully responsive.

## Deferred / Next
- Owner + Tenant auth (mocked owner "Pak Adi" for demo).
- Real payment gateway, WhatsApp, FCM, Google OAuth.
- Reports and Settings pages (marked SOON).
