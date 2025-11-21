# Kredi Takip - Documentation

This folder contains all project documentation, guides, and reference materials.

## Structure

```
docs/
├── README.md                           # This file
├── DOCUMENTATION.md                    # General project documentation
├── paytr/                              # PayTR payment integration docs
│   ├── 1. ADIM.pdf                    # PayTR Direct API Step 1
│   ├── 2. ADIM.pdf                    # PayTR Direct API Step 2
│   ├── Paytr Kart Saklama.pdf         # PayTR Card Storage (CAPI)
│   ├── LOCAL_TESTING_PAYTR.md         # Local testing guide with ngrok
│   ├── PAYTR_DIRECT_API_INTEGRATION.md
│   ├── PAYTR_DIRECT_API_MIGRATION_SUMMARY.md
│   ├── PAYTR_DIRECT_CLIENT_EXAMPLE.tsx
│   ├── PAYTR_DIRECT_TESTING_GUIDE.md
│   ├── PAYTR_MIGRATION_GUIDE.md
│   ├── PAYMENT_FORM_USAGE.md
│   └── Other PayTR PDF documentation
├── security/                           # Security documentation
│   ├── SECURITY_IMPROVEMENTS.md       # Security improvement guidelines
│   ├── TRUTHFUL_SECURITY_CLAIMS.md    # Security claims and compliance
│   └── SECURITY_CHECKLIST.md          # Security checklist
└── database/                           # Database documentation
    └── [Database migration docs]
```

## Quick Links

### PayTR Integration
- [Local Testing Guide](./paytr/LOCAL_TESTING_PAYTR.md) - How to test PayTR webhooks locally with ngrok
- [Direct API Integration](./paytr/PAYTR_DIRECT_API_INTEGRATION.md) - PayTR Direct API implementation
- [Payment Form Usage](./paytr/PAYMENT_FORM_USAGE.md) - How to use the payment form component
- [Migration Summary](./paytr/PAYTR_DIRECT_API_MIGRATION_SUMMARY.md) - Migration from iframe to Direct API

### Security
- [Security Checklist](./security/SECURITY_CHECKLIST.md) - Security audit checklist
- [Security Improvements](./security/SECURITY_IMPROVEMENTS.md) - Implemented security improvements
- [Security Claims](./security/TRUTHFUL_SECURITY_CLAIMS.md) - Truthful security documentation

### Database
Database migration scripts are located in `/database-scripts/migrations/`

## Development Workflow

1. **Local Testing**: Use ngrok for PayTR webhook testing (see [LOCAL_TESTING_PAYTR.md](./paytr/LOCAL_TESTING_PAYTR.md))
2. **Security**: Review security checklist before deployment
3. **Database Changes**: Add migrations to `/database-scripts/migrations/`

## Important Notes

- All PayTR credentials must be kept in `.env.local` (never commit)
- Card data never touches our server (PCI-DSS compliance)
- Use test mode for development: `PAYTR_TEST_MODE=1`
