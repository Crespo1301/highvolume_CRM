# HighVolume CRM – Website Sales CRM Context

## Purpose

HighVolume CRM is a high-speed outreach CRM designed for selling websites to local businesses.

It is optimized for:

- cold calling
- Facebook outreach
- high volume lead generation
- quick follow-ups
- closing website deals

The system must allow the user to add leads quickly, track conversations, schedule follow-ups, and move deals through a sales pipeline.

The CRM is designed for high activity environments, where the user may contact 50–150 businesses per day.

Speed and simplicity are critical.

## Business Model

The CRM supports a small website service business selling websites to local businesses.

Typical offers:

- Basic Website — $699
- Premium Website — $999
- Hosting / Maintenance — $49/month

Target industries include:

- contractors
- landscapers
- plumbers
- electricians
- cleaning companies
- construction companies
- accountants
- small restaurants

Lead sources include:

- Google Maps
- Facebook groups
- Instagram
- referrals
- in-person visits

## Core Workflow

Typical user workflow:

1. Find leads (Google Maps / Facebook)
2. Add leads to CRM
3. Run a quick website audit
4. Contact lead (call/message)
5. Log conversation
6. Move lead through pipeline
7. Schedule follow-ups
8. Send website examples
9. Close the deal

The CRM acts as the central command center for outreach.

## Core CRM Entities

### Lead

Represents a business that might need a website.

Fields:

```text
id
businessName
ownerName
phone
email
industry
city
websiteStatus
websiteUrl
leadSource
notes
dateAdded
priorityScore
```

Website status values:

```text
none
facebookOnly
outdated
good
```

Lead sources:

```text
googleMaps
facebook
instagram
walkIn
referral
```

### Contact Activity

Tracks every interaction.

```text
id
leadId
activityType
activityDate
notes
```

Activity types:

```text
coldCall
voicemail
text
email
facebookMessage
meeting
walkInVisit
```

### Deal / Opportunity

Represents a potential website project.

```text
id
leadId
dealStatus
packageType
dealValue
followUpDate
notes
```

Deal stages:

```text
new
contacted
interested
followUp
proposalSent
closedWon
closedLost
```

Website packages:

```text
basic699
premium999
premiumHosting
```

## Pipeline Board

Pipeline columns:

- New Lead
- Contacted
- Interested
- Follow Up
- Proposal Sent
- Closed Won
- Closed Lost

Deals should be draggable between columns.

This provides a visual sales pipeline.

## Lead Entry Design

The lead creation form must be extremely fast.

Required:

- Business Name
- Phone
- Industry
- City

Optional:

- Owner Name
- Email
- Website URL
- Notes

Goal:

Add a lead in under 10 seconds.

## Dashboard Metrics

Dashboard shows:

- Total Leads
- Calls Today
- Messages Today
- Meetings
- Deals Won
- Revenue This Month

## Website Audit Generator

When a lead has a website URL, the CRM should generate a quick audit checklist.

Purpose:

Provide talking points during cold calls.

Audit fields:

- Mobile Friendly
- Load Speed
- Contact Form
- Google Map
- Services Page
- Modern Design
- Clear Call To Action

Values:

- Good
- Needs Improvement
- Missing

## Lead Priority Scoring

The CRM should assign a priority score automatically.

Example scoring:

- No website → +5
- Facebook only → +4
- Outdated website → +3
- Good reviews but bad site → +4
- Local business → +2

Dashboard sections:

- High Priority Leads
- Medium Priority Leads
- Low Priority Leads

## Activity Tracker

The CRM tracks daily outreach.

Counters:

- Calls Today
- Messages Today
- Walk-ins Today
- Leads Added Today

## Sales Quotas & Goals

The CRM should track:

- Monthly quota
- Daily minimum
- Personal goals

### Monthly Quota

Example:

```text
Monthly Quota: $10,000
```

### Minimum Daily Revenue

Formula:

```text
remainingRevenue / remainingDays
```

### Personal Goals

User adjustable:

- Daily calls
- Weekly revenue
- Monthly revenue

## UI Requirements

Replace BenchCraft terminology.

Remove:

- Golf course
- Ad deal
- Course advertising

Replace with:

- Website deal
- Website packages
- Website audit

## Technology Stack

Frontend: React

Backend: Local storage

Hosting: Vercel

The system should remain fast and lightweight.

## Development Priority

1. Stable modals (no white screens)
2. Fast lead entry
3. Pipeline board
4. Website audit generator
5. Lead scoring
6. Outreach tracking

## Primary Objective

Transform HighVolume CRM into a high-speed sales engine for a website business.

The CRM should help the user:

- generate leads
- contact businesses
- track outreach
- schedule follow-ups
- close website deals

## Important for LLMs modifying this project

1. Never remove existing features unless explicitly requested.
2. Always build on top of the current version of the code.
3. Avoid introducing breaking state changes in React context.
4. Preserve modal close logic and keyboard navigation.
5. Ensure any new features integrate with existing CRM data structures.

## Recommended next features

1. Pipeline drag board
2. Website audit auto generator
3. Lead scoring dashboard
