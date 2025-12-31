# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Kredi Takip** is a Next.js 14 credit tracking application for Turkish users to manage their loans, credit cards, and financial health. The application uses Supabase for backend services, PayTR for payment processing, and Google Gemini AI for OCR analysis of bank statements.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database**: Supabase (PostgreSQL)
- **UI**: React 18, Radix UI, Tailwind CSS, shadcn/ui
- **Authentication**: Supabase Auth
- **Payment**: PayTR (migrated from Paddle)
- **AI/OCR**: Google Gemini AI
- **Email**: MailerSend/Mailjet
- **State Management**: React hooks, server components
- **Charts**: Chart.js, Recharts
- **PDF Generation**: jsPDF
- **Form Handling**: React Hook Form + Zod validation
- **Encryption**: crypto-js for sensitive data (banking credentials)

## Development Commands

```bash
# Development
pnpm dev              # Start dev server on localhost:3000
pnpm build            # Build for production
pnpm start            # Start production server
pnpm lint             # Run ESLint

# Database migrations
npx supabase db reset           # Reset local database
npx supabase migration new      # Create new migration
npx supabase db push            # Push migrations to remote
node scripts/apply-migrations.js  # Apply migrations programmatically
```

## Architecture

### Directory Structure

```
app/                    # Next.js 14 App Router pages
├── (marketing)/        # Public pages (landing, pricing, etc.)
├── admin/              # Admin dashboard
├── api/                # API routes
├── auth/               # Authentication pages
├── blog/               # Blog system
└── uygulama/           # Main application (authenticated)
    ├── ana-sayfa/      # Dashboard
    ├── krediler/       # Loans management
    ├── kredi-kartlari/ # Credit cards
    ├── hesaplar/       # Bank accounts
    ├── finansal-saglik/ # Financial health analysis
    ├── raporlar/       # Reports
    └── ayarlar/        # Settings

components/             # React components
├── ui/                 # shadcn/ui components
├── layout/             # Header, Footer
├── reports/            # Chart components
└── subscription/       # Subscription UI

lib/                    # Utilities and business logic
├── api/                # API client functions
├── supabase/           # Supabase clients
├── utils/              # Utility functions
└── types.ts            # TypeScript type definitions

supabase/
├── migrations/         # Database migration files
└── database.sql        # Full schema backup

scripts/                # Utility scripts for cron jobs
```

### Key Architectural Patterns

#### Server vs Client Components

- **Server Components** (default): Used for data fetching, authentication checks, and layouts
- **Client Components**: Used for interactivity, forms, and state management (marked with `'use client'`)
- Pages fetch data server-side, components handle UI interactions client-side

#### Authentication Flow

1. Middleware (`middleware.ts`) refreshes Supabase sessions on every request
2. Uses Supabase SSR cookies for session management
3. `createServerClient()` for server components/API routes
4. Protected routes check user session, redirect to `/giris` if unauthenticated
5. Admin routes use `lib/admin-check.ts` to verify admin role

#### Database Access Patterns

- **Server Components/API Routes**: Use `createServerClient()` from `lib/supabase/server.ts`
- **Admin Operations**: Use `createServiceRoleClient()` for elevated permissions
- **Client Side**: Use `createClient()` from `lib/supabase/client.ts`
- All database types defined in `lib/types.ts` (Database interface)

#### Subscription System

- **Plans**: Free, Pro (monthly/yearly), Premium (monthly/yearly)
- **Features**: OCR analysis credits, AI financial health analysis, ad-free experience
- **Payment**: PayTR integration (previously Paddle, fully migrated)
- **Database Tables**:
  - `subscriptions`: User subscription records
  - `subscription_plans`: Available plans
  - `invoices`: Payment invoices
  - `payment_transactions`: Payment history

#### Encryption for Sensitive Data

- Banking credentials stored encrypted using `lib/utils/encryption.ts`
- Uses AES encryption with `ENCRYPTION_KEY` environment variable
- Never expose decrypted passwords in logs or client-side code

### Important Database Tables

- **profiles**: User profile information
- **credits**: Loan/credit records with payment tracking
- **payment_plans**: Installment schedules
- **credit_cards**: Credit card tracking
- **accounts**: Bank account balances
- **banking_credentials**: Encrypted bank login credentials
- **notifications**: User notifications
- **financial_profiles**: Income, expenses, assets data
- **risk_analyses**: AI-generated financial health analysis

### API Route Patterns

```typescript
// Standard API route structure
import { createServerClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Business logic here
  return Response.json({ success: true, data })
}
```

### Environment Variables

Critical environment variables (see `.env.example`):

- `ENCRYPTION_KEY`: For encrypting sensitive data (banking credentials)
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase connection
- `SERVICE_ROLE_KEY`: Supabase admin operations
- `PAYTR_MERCHANT_ID`, `PAYTR_MERCHANT_KEY`, `PAYTR_MERCHANT_SALT`: Payment gateway
- `GEMINI_API_KEY`: Google AI for OCR
- `MAILERSEND_API_KEY` or `MAILJET_API_KEY`: Email service
- `CRON_SECRET`: Secure cron job endpoints

### Security Considerations

1. **Content Security Policy**: Configured in `next.config.mjs` and `middleware.ts` to allow PayTR iframe integration
2. **HTTPS Only**: Production enforces HTTPS via Strict-Transport-Security header
3. **Encrypted Data**: Banking credentials encrypted at rest
4. **RLS Policies**: Supabase Row Level Security enabled on all tables
5. **CSRF Protection**: Cron jobs require `CRON_SECRET` header
6. **Rate Limiting**: Implemented via `lib/rate-limit.ts` using Vercel KV or in-memory store

### Payment Integration (PayTR)

- Migrated from Paddle to PayTR for Turkish market
- 3D Secure iframe integration for card payments
- Webhook handlers for payment callbacks at `/api/paytr/callback`
- Subscription renewal via `/api/paytr/renew`
- Legacy Paddle code removed, tables cleaned up

### OCR & AI Features

- **PDF Analysis**: Upload bank statements, extract payment schedules via Gemini AI
- **Financial Health Analysis**: AI-generated risk assessment based on user's financial data
- **Usage Tracking**: OCR and AI analysis counts tracked per subscription tier
- API endpoint: `/api/analyze-pdf` for OCR processing
- API endpoint: `/api/risk-analysis` for financial health

### Cron Jobs

Located in `app/api/cron/` and `scripts/`:

- **Subscription Expiry Check**: Check and downgrade expired subscriptions
- **Grace Period Handler**: Manage grace periods before downgrade
- **Notification Reminders**: Send payment due date reminders
- **Weekly/Monthly Summaries**: Email payment summaries to users
- **Webhook Cleanup**: Clean old webhook logs

Secured with `CRON_SECRET` header verification.

### Common Patterns

#### Fetching User Subscription

```typescript
const supabase = await createServerClient()
const { data: { user } } = await supabase.auth.getUser()

const { data: subscription } = await supabase
  .from('user_subscriptions')
  .select('*')
  .eq('user_id', user.id)
  .single()
```

#### Checking Feature Access

```typescript
// Check if user has remaining OCR credits
const { data, error } = await fetch('/api/subscription/check-feature', {
  method: 'POST',
  body: JSON.stringify({ feature: 'ocr_analysis' })
})
```

#### Creating Notifications

```typescript
import { createNotification } from '@/lib/api/notifications-server'

await createNotification({
  user_id: userId,
  title: 'Payment Reminder',
  message: 'Your payment is due tomorrow',
  credit_id: creditId // optional
})
```

### Testing

- No formal test suite currently
- Test locally with `pnpm dev`
- Use `TEST_MODE` and `TEST_EMAIL` environment variables for email testing
- PayTR test mode controlled by `PAYTR_TEST_MODE=1`

### Deployment

- Hosted on Vercel
- Automatic deployments from `main` branch
- Environment variables configured in Vercel dashboard
- Database hosted on Supabase cloud
- Uses Supabase MCP for database operations (see `.mcp.json`)

### Localization

- All UI text in Turkish
- Date formatting uses Turkish locale (`tr-TR`)
- Currency formatted as Turkish Lira (₺)
- Use `date-fns` with Turkish locale for date operations

### Code Style

- TypeScript strict mode enabled
- Use async/await over promises
- Server components by default, `'use client'` only when needed
- Prefer server-side data fetching in page components
- Use shadcn/ui components for consistency
- CSS via Tailwind utilities, avoid custom CSS files
