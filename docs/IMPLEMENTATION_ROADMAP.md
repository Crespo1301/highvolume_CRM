# Implementation Roadmap

## Current working priorities

1. Stabilize modal architecture
   - one close path for X / Cancel / overlay / Escape
   - clear local form state on close

2. Stabilize React context
   - avoid temporal dead zone issues
   - export every value consumed by components
   - prefer hoisted helper functions or define helper callbacks before dependents

3. Preserve existing implemented features
   - callback date and time
   - due today follow-up color
   - quotas / goals / minimum per day
   - sales editing
   - spacebar manual tally

## Next implementation wave

1. Website audit generator
2. Lead scoring
3. Pipeline board
4. Outreach tracker by channel
5. Rep attribution and team queues
