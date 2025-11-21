# Mailjet Email Integration Setup

This document explains how to set up and use Mailjet for email functionality in the KrediTakip application.

## Overview

The application uses Mailjet for:
- **Contact Form**: Sending contact form submissions to admin
- **Newsletter Subscriptions**: Managing newsletter subscribers and sending welcome emails
- **Invoice Notifications**: Sending payment/subscription notifications to admin
- **Payment Reminders**: Sending payment reminder emails to users (future implementation)

## Environment Variables

Add the following environment variables to your Vercel project or `.env.local` file:

\`\`\`bash
MAILJET_API_KEY=your_mailjet_api_key
MAILJET_SECRET_KEY=your_mailjet_secret_key
\`\`\`

### How to Get Mailjet API Keys

1. Sign up for a free account at [Mailjet](https://www.mailjet.com/)
2. Go to **Account Settings** → **API Key Management**
3. Copy your **API Key** and **Secret Key**
4. Add them to your environment variables

## Features Implemented

### 1. Contact Form (`/iletisim`)

**API Route**: `/api/contact/route.ts`

- Accepts contact form submissions
- Validates email format and required fields
- Sends formatted email to `info@kreditakip.com.tr`
- Returns success/error messages to the user

**Email Template**: Professional HTML email with:
- Contact person details (name, email, phone)
- Subject and message
- Branded styling with emerald/teal gradient

### 2. Newsletter Subscription (Footer)

**API Route**: `/api/newsletter/subscribe/route.ts`

- Accepts email subscriptions from footer forms
- Validates email format
- Checks for duplicate subscriptions in database
- Adds contact to Mailjet contact list
- Stores subscription in `newsletter_subscribers` table
- Sends welcome email to new subscribers

**Database Table**: `newsletter_subscribers`
- Tracks active/inactive subscriptions
- Stores subscription timestamps
- Includes RLS policies for security

**Email Template**: Welcome email with:
- Platform introduction
- List of newsletter benefits
- Call-to-action button
- Unsubscribe information

### 3. Invoice Notifications

**File**: `/lib/email/invoice-notification.ts`

- Sends payment confirmation emails to admin
- Includes complete billing information
- Shows payment details, customer info, and address
- Professional invoice-style HTML template

## API Endpoints

### POST `/api/contact`

Send contact form submission.

**Request Body**:
\`\`\`json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "phone": "+90 555 123 4567",
  "subject": "Question about pricing",
  "message": "I would like to know more about..."
}
\`\`\`

**Response**:
\`\`\`json
{
  "success": true,
  "message": "Mesajınız başarıyla gönderildi..."
}
\`\`\`

### POST `/api/newsletter/subscribe`

Subscribe to newsletter.

**Request Body**:
\`\`\`json
{
  "email": "user@example.com"
}
\`\`\`

**Response**:
\`\`\`json
{
  "success": true,
  "message": "Bültenimize başarıyla abone oldunuz!..."
}
\`\`\`

## Components Updated

### 1. `/app/iletisim/page.tsx`
- Converted to client component with form state management
- Added form submission handler
- Displays success/error messages
- Shows loading state during submission
- Clears form on successful submission

### 2. `/components/footer.tsx`
- Added newsletter subscription form handler
- Displays success/error feedback
- Shows loading spinner during submission
- Clears email input on success

### 3. `/components/layout/footer.tsx`
- Same newsletter functionality as main footer
- Consistent user experience across layouts

## Email Templates

All email templates use:
- Responsive HTML design
- Emerald/teal gradient branding
- Mobile-friendly layouts
- Professional typography
- Clear call-to-action buttons

## Database Schema

Run the migration script to create the newsletter subscribers table:

\`\`\`bash
# The script is located at:
scripts/40-create-newsletter-subscribers.sql
\`\`\`

This creates:
- `newsletter_subscribers` table
- Indexes for performance
- RLS policies for security

## Testing

### Test Contact Form
1. Go to `/iletisim`
2. Fill out the form
3. Submit and check `info@kreditakip.com.tr` inbox

### Test Newsletter
1. Scroll to footer on any page
2. Enter email address
3. Click subscribe button
4. Check email inbox for welcome message

## Migration from MailerSend

The following files were updated to use Mailjet instead of MailerSend:

- ✅ `/lib/email/invoice-notification.ts` - Invoice notifications
- ✅ `/app/api/contact/route.ts` - New contact form API
- ✅ `/app/api/newsletter/subscribe/route.ts` - New newsletter API
- ⚠️ `/app/api/notifications/send-reminders/route.tsx` - Still uses MailerSend (needs update)
- ⚠️ `/scripts/send-email-notifications.js` - Still uses MailerSend (needs update)

## Next Steps

To complete the Mailjet migration:

1. Update payment reminder emails in `/app/api/notifications/send-reminders/route.tsx`
2. Update batch notification script in `/scripts/send-email-notifications.js`
3. Remove `mailersend` package from dependencies
4. Remove `MAILERSEND_API_KEY` environment variable
5. Update GitHub Actions workflows to use Mailjet

## Troubleshooting

### Emails not sending
- Check that `MAILJET_API_KEY` and `MAILJET_SECRET_KEY` are set correctly
- Verify sender email (`bildirim@kreditakip.com.tr`) is verified in Mailjet
- Check Mailjet dashboard for delivery status

### Database errors
- Ensure `newsletter_subscribers` table exists
- Check RLS policies are enabled
- Verify Supabase connection

### Form validation errors
- Check email format is valid
- Ensure all required fields are filled
- Check browser console for detailed errors

## Support

For issues or questions:
- Email: info@kreditakip.com.tr
- Check Mailjet documentation: https://dev.mailjet.com/
