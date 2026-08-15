// Calendly integration helpers (server-side only).
// Env vars: CALENDLY_EVENT_URL (public scheduling link),
//           CALENDLY_WEBHOOK_SECRET (used to verify webhook signatures).

import { createHmac, timingSafeEqual } from "crypto";

export function isCalendlyConfigured(): boolean {
  return Boolean(process.env.CALENDLY_EVENT_URL?.trim());
}

export function getCalendlyEventUrl(): string | null {
  const url = process.env.CALENDLY_EVENT_URL?.trim();
  if (!url) return null;
  try {
    // Validate it's a real URL before handing it to users.
    new URL(url);
    return url;
  } catch {
    return null;
  }
}

/** Append Calendly's supported name/email prefill params to the scheduling link. */
export function buildCalendlyPrefillUrl(baseUrl: string, name?: string | null, email?: string | null): string {
  try {
    const url = new URL(baseUrl);
    if (name?.trim()) url.searchParams.set("name", name.trim());
    if (email?.trim()) url.searchParams.set("email", email.trim());
    return url.toString();
  } catch {
    return baseUrl;
  }
}

/**
 * Verify a Calendly webhook signature.
 * Calendly signs the raw payload with HMAC-SHA256 using the webhook secret
 * and sends it in the X-Webhook-Signature header.
 */
export function verifyCalendlySignature(rawBody: string, signatureHeader: string | null): boolean {
  const secret = process.env.CALENDLY_WEBHOOK_SECRET?.trim();
  if (!secret) return false;
  if (!signatureHeader) return false;

  const expected = createHmac("sha256", secret).update(rawBody, "utf8").digest("hex");
  const provided = signatureHeader.trim();

  if (expected.length !== provided.length) return false;
  try {
    return timingSafeEqual(Buffer.from(expected, "utf8"), Buffer.from(provided, "utf8"));
  } catch {
    return false;
  }
}

export interface CalendlyInviteeInfo {
  event: string;
  inviteeName: string | null;
  inviteeEmail: string | null;
  scheduledAt: string | null;
  eventTypeName: string | null;
  inviteeUuid: string | null;
  timezone: string | null;
  cancelReason?: string | null;
}

/** Extract useful booking info from a Calendly webhook payload. */
export function parseCalendlyPayload(payload: Record<string, unknown>): CalendlyInviteeInfo {
  const event = String(payload.event || "");
  const p = payload.payload as Record<string, unknown> | undefined;
  const invitee = (p?.invitee || p) as Record<string, unknown> | undefined;
  const eventType = (p?.event_type || {}) as Record<string, unknown>;
  const tracking = (invitee?.tracking || {}) as Record<string, unknown>;

  return {
    event,
    inviteeName: (invitee?.name as string) || (tracking?.name as string) || null,
    inviteeEmail: (invitee?.email as string) || (tracking?.email as string) || null,
    scheduledAt:
      ((invitee?.scheduled_event as Record<string, unknown> | undefined)?.start_time as string) ||
      (p?.scheduled_event as string) ||
      null,
    eventTypeName: (eventType?.name as string) || null,
    inviteeUuid: (invitee?.uuid as string) || null,
    timezone: (invitee?.timezone as string) || null,
    cancelReason: (p?.cancel_reason as string) || null,
  };
}
