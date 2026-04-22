<div align="center">

# HighVolume CRM

Keyboard-first CRM for high-volume outreach, local lead generation, follow-up management, and lightweight audit prep.

[Live App](https://highvolume-crm.vercel.app) • [Features](#features) • [Getting Started](#getting-started) • [Workflow](#workflow) • [Keyboard Shortcuts](#keyboard-shortcuts)

</div>

## Overview

HighVolume CRM is a fast outreach workspace built for operators who need to find leads, work them quickly, and stay organized while calling, emailing, and following up.

The current product supports:

- Google Places lead imports
- Facebook-style lead intake
- CSV and JSON imports
- Lead enrichment and scoring
- Outreach queue management
- Rule-based website audits
- Email draft generation and email logging
- Follow-up tracking, sales tracking, and performance analytics

## Features

### Lead generation and intake

- Import local businesses directly from Google Places
- Paste Facebook page leads into the CRM in a structured format
- Import CSV or JSON lead lists with richer fields like website status, city, region, source, and notes
- Track recent import jobs inside the app

### Lead quality and enrichment

- Website status normalization: `unknown`, `none`, `facebookOnly`, `outdated`, `good`
- Automatic priority scoring and priority labels
- Outreach angle generation for every enriched lead
- Bulk enrichment for older leads already in the CRM

### Outreach workflow

- Dedicated `Outreach` queue for the best call/email-ready leads
- Outreach statuses: `new`, `audit_ready`, `contacted`, `follow_up`, `replied`
- Quick email logging with generated subject and body
- Follow-up scheduling and overdue visibility

### Audit workflow

- Deterministic website audits based on website status and lead context
- Audit summaries and talking points stored with the CRM
- Recent audits visible from the dashboard

### Performance tracking

- Daily calls, goals, quota, and sales
- Email and audit counts in analytics
- Follow-up visibility and recent activity

## Getting Started

### Prerequisites

- Node.js `20.19+` or `22.12+` recommended
- npm
- A Google Cloud API key with `Places API (New)` enabled if you want Google Places imports

### Install

```bash
npm install
```

### Local development

```bash
npm run dev
```

### Build

```bash
npm run build
```

## Environment Variables

Create a local env file for development:

```bash
GOOGLE_PLACES_API_KEY=your_key_here
```

For Vercel deployments, set the same variable in the project environment settings.

Important:

- The Google Cloud project must have `Places API (New)` enabled
- Billing must be enabled in Google Cloud
- API key restrictions must allow the Places API requests your deployment makes

## Workflow

### Recommended daily flow

1. Import fresh leads from Google Places for one market and one industry.
2. Add Facebook leads you found manually.
3. Run bulk enrichment for missing website status or location data.
4. Open the `Outreach` queue and focus on `hot` and `normal` leads.
5. Generate audits for strong prospects.
6. Call or email leads from the same CRM.
7. Set follow-ups and keep the queue moving.

### Importing Google Places leads

Open `Import` and use:

- Market preset
- Industry
- Max results
- Optional market assignment

The CRM will normalize:

- business name
- address
- phone
- website
- rating and review count
- city and region
- source
- priority score
- outreach angle

### Importing Facebook leads

Use the `Facebook Lead Intake` section in Import and paste one lead per line:

```text
Business Name | Facebook URL | Phone | Email | Website | City | Region
```

You can also paste one JSON object per line.

### Running enrichment

Use `Bulk Lead Enrichment` when:

- website status is missing
- city or region is missing
- older leads need updated scoring
- you want fresh outreach angles

### Working the outreach queue

Open `Outreach` and focus on leads that have:

- strong priority
- phone, email, or Facebook presence
- audit potential

Use the lead detail view to:

- generate an audit
- change outreach status
- log an email
- set a follow-up

## Keyboard Shortcuts

### Navigation

- `1` Dashboard
- `3` Leads
- `O` Outreach
- `F` Follow-ups
- `V` Converted
- `7` DNC
- `9` Dead
- `C` Calls
- `$` Sales
- `G` Markets
- `T` Trash
- `A` Analytics
- `-` Emails

### Actions

- `SPACE` manual tally
- `E` quick email
- `Enter` open selected lead
- `Left` move selected lead to DNC
- `Right` move selected lead to Dead
- `.` delete selected item
- `+` add lead
- `I` import
- `X` export
- `S` settings
- `/` help
- `Esc` close modal or clear focused interaction

## Mobile Support

The product is still desktop-first for heavy keyboard-driven workflows, but the landing page and app shell are now tuned to behave better on smaller screens:

- stacked header and stats on smaller widths
- responsive nav grid
- more flexible footer layout
- single-column help overlay on phones

For best results:

- use desktop or laptop for long calling sessions
- use mobile for quick review, follow-ups, and basic CRM navigation

## Deployment

### Vercel

This project is deployed on Vercel.

Deploy preview:

```bash
npx vercel deploy --yes
```

Deploy production:

```bash
npx vercel deploy --prod --yes
```

## Current Product Notes

The CRM currently supports lead intake, enrichment, outreach prep, audits, and tracking. It does not yet:

- automatically send Gmail from inside the app
- crawl Facebook directly
- run scheduled lead collection by itself
- automatically detect replies from inboxes

Those are good next-phase automation targets.

## Live Project

- Production: [https://highvolume-crm.vercel.app](https://highvolume-crm.vercel.app)

## Author

Carlos Crespo  
[https://carloscrespo.info](https://carloscrespo.info)
