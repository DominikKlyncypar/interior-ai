# Interior AI

Interior AI is a private workflow automation platform built for an interior design studio. It combines a Next.js operations dashboard with a background worker that monitors inboxes, drafts replies, manages account branding, and supports human review before sending.

## What It Does

- Connects Gmail and Outlook accounts
- Pulls inbound email into a unified dashboard
- Supports branded reply composition with signature and logo handling
- Queues background jobs for email processing and follow-up workflows
- Stores account, branding, and message state in Supabase

## Architecture

This repo is a small monorepo with two apps:

- `apps/dashboard`: Next.js admin interface and API routes
- `apps/worker`: background job runner for email ingestion and processing

Core services:

- `Next.js` for the authenticated web app
- `Supabase` for persistence and storage
- `Redis` and `BullMQ` for queued work
- `Google Gmail API` and `Microsoft Graph` for mailbox integrations

## Repository Structure

```text
apps/
  dashboard/   Next.js dashboard and API routes
  worker/      background worker and schedulers
```

## Local Development

### Prerequisites

- Node.js 24+
- A Supabase project
- Redis
- Google OAuth credentials
- Azure AD / Microsoft Graph credentials

### Environment

Copy `.env.example` and fill in the required values for:

- Supabase
- Redis
- Google OAuth
- Azure AD
- Anthropic

### Run The Apps

From the repo root:

```bash
npm run dev:dashboard
npm run dev:worker
```

Or run each app independently from its own folder.

Dashboard scripts:

```bash
cd apps/dashboard
npm run dev
npm run lint
npm run test:email
```

Worker scripts:

```bash
cd apps/worker
npm run dev
npm run build
```

## Notes

- This project is tailored to an internal studio workflow rather than a generic SaaS product.
- Email rendering differs across clients. The dashboard includes local email composition tests to validate signature and inline-image behavior before live mailbox testing.
