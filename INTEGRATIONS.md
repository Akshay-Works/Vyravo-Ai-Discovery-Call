# Integrations — HubSpot, Calendly, Resend

All secrets live **only** in Vercel environment variables (server-side). Nothing is exposed to the browser.

## Environment variables (Vercel project: `vyravo-ai-discovery-call`)

| Variable | Required | Purpose |
|---|---|---|
| `HUBSPOT_ACCESS_TOKEN` | For CRM sync | HubSpot private app token. Scopes: `crm.objects.contacts.read/write`, `crm.objects.deals.read/write` (+ `crm.schemas.contacts.read/write` to auto-create `vyravo_*` custom fields — without it the sync falls back to standard fields only). |
| `CALENDLY_EVENT_URL` | For scheduling | Full scheduling link of your discovery-call event type, e.g. `https://calendly.com/your-account/discovery-call` |
| `CALENDLY_WEBHOOK_SECRET` | Recommended | The secret shown when you create the Calendly webhook. When set, requests with invalid signatures are rejected (HTTP 401). |
| `RESEND_API_KEY` | For emails | Resend → API Keys |
| `RESEND_FROM_EMAIL` | For emails | A verified sender, e.g. `Akshay from Vyravo AI <hello@yourdomain.com>` |

## Flow

1. Visitor completes qualification → **POST /api/book**
   - Lead saved to Postgres (existing behavior, unchanged)
   - HubSpot: contact created/updated (deduped by email) + deal at **Prospecting** (hot leads: **Qualification**)
   - Resend: confirmation email to the lead + internal notification
   - Response includes `calendlyUrl` (prefilled with name/email) shown on the success screen
2. Visitor books on Calendly → Calendly webhook → **POST /api/webhooks**
   - Signature verified (HMAC-SHA256, `X-Webhook-Signature`) when `CALENDLY_WEBHOOK_SECRET` is set
   - `invitee.created`: lead updated (`meetingStatus=scheduled`, `stage=discovery_scheduled`), HubSpot deal moved to a Discovery stage **if one exists**, otherwise Qualification; booking confirmation email sent
   - `invitee.canceled`: lead `meetingStatus=cancelled`
   - A booking is only treated as confirmed once this webhook fires.

## Calendly webhook setup

- URL: `https://vyravo-ai-discovery-call.vercel.app/api/webhooks`
- Events: `invitee.created`, `invitee.canceled`
- Copy the webhook secret into `CALENDLY_WEBHOOK_SECRET`.

## HubSpot field mapping

Standard: `firstname`, `lastname`, `email`, `phone`, `company`, `website`, `country`
Custom (auto-created when the token allows): `vyravo_industry`, `vyravo_company_size`, `vyravo_budget_range`, `vyravo_timeline`, `vyravo_lead_score`, `vyravo_lead_category`, `vyravo_challenges`, `vyravo_goals`, `vyravo_source`
Deal: `dealname`, `pipeline` (default), `dealstage` (resolved by label), `description` (qualification summary), associated to the contact.

## Graceful degradation

Every integration is optional. If a variable is missing, the flow continues and the API response reports the exact status (`integrations.hubspot`, `integrations.emailConfirmation`, `calendlyUrl: null`).
