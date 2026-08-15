import { db } from "@/db";
import { leads, webhookLogs } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { verifyCalendlySignature, parseCalendlyPayload } from "@/lib/integrations/calendly";
import { updateDealStageForEmail } from "@/lib/integrations/hubspot";
import { sendEmail, wrapHtmlEmail, textToHtml } from "@/lib/integrations/resend";
import { getConfirmationEmail } from "@/lib/discovery/emails";

// Webhook endpoint for external integrations (Calendly, etc.)
export async function POST(request: Request) {
  try {
    // Read the raw body first — Calendly signatures are computed over it.
    const rawBody = await request.text();
    let body: Record<string, unknown>;
    try {
      body = JSON.parse(rawBody);
    } catch {
      return Response.json({ error: "Invalid JSON payload" }, { status: 400 });
    }

    // Calendly doesn't send x-webhook-type, so detect from the payload too.
    const headerType = request.headers.get("x-webhook-type");
    const looksLikeCalendly =
      typeof body.event === "string" && (body.event as string).startsWith("invitee.");
    const webhookType = headerType || (looksLikeCalendly ? "calendly" : "unknown");

    // Log the webhook
    await db.insert(webhookLogs).values({
      webhookType,
      status: "received",
      payload: body,
    });

    // Handle different webhook types
    switch (webhookType) {
      case "calendly": {
        // Signature verification — required when a secret is configured.
        const secretConfigured = Boolean(process.env.CALENDLY_WEBHOOK_SECRET?.trim());
        const signature = request.headers.get("x-webhook-signature");
        if (secretConfigured && !verifyCalendlySignature(rawBody, signature)) {
          return Response.json({ error: "Invalid webhook signature" }, { status: 401 });
        }
        return handleCalendlyWebhook(body);
      }
      case "stripe":
        return handleStripeWebhook(body);
      default:
        return Response.json({ received: true });
    }
  } catch (error) {
    console.error("Webhook error:", error);
    return Response.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}

async function handleCalendlyWebhook(payload: Record<string, unknown>) {
  const info = parseCalendlyPayload(payload);

  switch (info.event) {
    case "invitee.created":
      return handleBookingConfirmed(info);
    case "invitee.canceled":
      return handleBookingCanceled(info);
    default:
      console.log("Unhandled Calendly event:", info.event);
      return Response.json({ received: true });
  }
}

/**
 * Calendly confirmed a booking. This is the moment the booking is real —
 * update the lead, advance the HubSpot deal, and send the confirmation email.
 */
async function handleBookingConfirmed(info: ReturnType<typeof parseCalendlyPayload>) {
  if (!info.inviteeEmail) {
    return Response.json({ received: true, note: "No invitee email in payload" });
  }
  const email = info.inviteeEmail.trim().toLowerCase();

  // Find the matching lead (most recent by email).
  const matches = await db
    .select()
    .from(leads)
    .where(eq(leads.email, email))
    .orderBy(desc(leads.createdAt))
    .limit(1);
  const lead = matches[0];

  const meetingDate = info.scheduledAt ? new Date(info.scheduledAt) : null;
  const meetingTime = meetingDate
    ? meetingDate.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: info.timezone || "UTC" })
    : "";
  const meetingDateLabel = meetingDate
    ? meetingDate.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric", timeZone: info.timezone || "UTC" })
    : "";

  // 1. Update the local lead record.
  if (lead) {
    await db
      .update(leads)
      .set({
        meetingStatus: "scheduled",
        meetingDate,
        meetingTimezone: info.timezone || lead.meetingTimezone,
        meetingLink: info.inviteeUuid
          ? `https://calendly.com/meetings/${info.inviteeUuid}`
          : lead.meetingLink,
        stage: "discovery_scheduled",
        updatedAt: new Date(),
      })
      .where(eq(leads.id, lead.id));
  }

  // 2. Advance the HubSpot deal (best-effort). Use a Discovery Call stage
  //    if one exists in the pipeline; otherwise stay at Qualification.
  const hubspotStage = await updateDealStageForEmail(email, [
    "Discovery Call Scheduled",
    "Discovery Call",
    "Meeting Scheduled",
    "Qualification",
  ]).catch(() => ({ ok: false as const }));

  // 3. Send the booking confirmation email via Resend (best-effort).
  let emailSent = false;
  if (lead && meetingDateLabel && meetingTime) {
    const confirmation = getConfirmationEmail({
      name: lead.fullName || info.inviteeName || "there",
      meetingDate: meetingDateLabel,
      meetingTime,
      timezone: info.timezone || "UTC",
      meetingLink: lead.meetingLink || "",
    });
    const result = await sendEmail({
      to: email,
      subject: confirmation.subject,
      html: wrapHtmlEmail("Your discovery call is confirmed", textToHtml(confirmation.body)),
      text: confirmation.body,
    });
    emailSent = result.ok;
  }

  return Response.json({
    received: true,
    bookingConfirmed: true,
    leadFound: Boolean(lead),
    hubspotUpdated: Boolean((hubspotStage as { ok?: boolean })?.ok),
    confirmationEmailSent: emailSent,
  });
}

async function handleBookingCanceled(info: ReturnType<typeof parseCalendlyPayload>) {
  if (!info.inviteeEmail) {
    return Response.json({ received: true, note: "No invitee email in payload" });
  }
  const email = info.inviteeEmail.trim().toLowerCase();

  const matches = await db
    .select({ id: leads.id })
    .from(leads)
    .where(eq(leads.email, email))
    .orderBy(desc(leads.createdAt))
    .limit(1);

  if (matches[0]) {
    await db
      .update(leads)
      .set({ meetingStatus: "cancelled", updatedAt: new Date() })
      .where(eq(leads.id, matches[0].id));
  }

  return Response.json({ received: true, bookingCanceled: true, leadFound: Boolean(matches[0]) });
}

async function handleStripeWebhook(payload: Record<string, unknown>) {
  // Stripe webhooks are logged above; extend when payment tracking is needed.
  console.log("Stripe webhook received:", payload.type);
  return Response.json({ received: true });
}
