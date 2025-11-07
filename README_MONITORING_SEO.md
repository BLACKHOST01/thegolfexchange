# The Golf Exchange — SEO + Event Tracking

## Setup
1. Ensure `.env` contains:
   - DATABASE_URL
   - NEXT_PUBLIC_SITE_URL
   - THE_GOLF_EXCHANGE_ADMIN_API_KEY

2. Add Event model to `prisma/schema.prisma` and run:
   ```bash
   npx prisma migrate dev --name create_events_table
