import { db } from "@/db";
import { leads } from "@/db/schema";
import { qualifyLead, generateMeetingBrief } from "@/lib/discovery/scoring";
import type { LeadFormData } from "@/lib/discovery/types";
import { syncLeadToHubSpot } from "@/lib/integrations/hubspot";
import { sendEmail, wrapHtmlEmail, textToHtml } from "@/lib/integrations/resend";
import { getCalendlyEventUrl, buildCalendlyPrefillUrl } from "@/lib/integrations/calendly";
import { getLeadReceivedEmail, getInternalLeadNotificationEmail } from "@/lib/discovery/emails";
import { COMPANY } from "@/lib/constants";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const formData = body as LeadFormData & { 
      meetingDate?: string;
      meetingTimezone?: string;
      meetingLink?: string;
    };

    // Validate required fields
    if (!formData.fullName || !formData.email) {
      return Response.json(
        { error: "Name and email are required." },
        { status: 400 }
      );
    }

    // Qualify the lead
    const qualification = qualifyLead(formData);
    
    // Generate meeting brief
    const meetingBrief = generateMeetingBrief(formData, qualification);

    // Insert lead into database
    const [newLead] = await db.insert(leads).values({
      // Basic Info
      fullName: formData.fullName,
      email: formData.email,
      phone: formData.phone || null,
      
      // Business Info
      businessName: formData.businessName || null,
      businessWebsite: formData.businessWebsite || null,
      industry: formData.industry || null,
      companySize: formData.companySize || null,
      country: formData.country || null,
      
      // Qualification Info
      currentSoftware: formData.currentSoftware || null,
      biggestChallenge: formData.biggestChallenge || null,
      automationGoals: formData.automationGoals || null,
      monthlyLeads: formData.monthlyLeads || null,
      desiredOutcome: formData.desiredOutcome || null,
      budgetRange: formData.budgetRange || null,
      timeline: formData.timeline || null,
      additionalInfo: formData.additionalInfo || null,
      
      // AI Analysis
      leadScore: qualification.score,
      leadCategory: qualification.category,
      leadType: qualification.type,
      recommendedServices: qualification.recommendedServices.map(s => s.service),
      qualificationSummary: qualification.summary,
      
      // Meeting Info (if provided)
      meetingStatus: formData.meetingDate ? "scheduled" : "pending",
      meetingDate: formData.meetingDate ? new Date(formData.meetingDate) : null,
      meetingTimezone: formData.meetingTimezone || null,
      meetingLink: formData.meetingLink || null,
      
      // Meeting Brief
      meetingBrief: meetingBrief,
      
      // Tracking
      source: "website",
    }).returning({ id: leads.id });

    // ------------------------------------------------------------------
    // Integrations — each is best-effort and never breaks the booking.
    // ------------------------------------------------------------------
    const integrationStatus: {
      hubspot: { ok: boolean; detail?: string };
      emailConfirmation: { ok: boolean; detail?: string };
    } = {
      hubspot: { ok: false },
      emailConfirmation: { ok: false },
    };

    // 1. HubSpot: create/update contact + deal (deduped by email).
    const dealStage = qualification.category === "hot" ? "Qualification" : "Prospecting";
    const hubspotResult = await syncLeadToHubSpot(
      {
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        businessName: formData.businessName,
        businessWebsite: formData.businessWebsite,
        industry: formData.industry,
        companySize: formData.companySize,
        country: formData.country,
        biggestChallenge: formData.biggestChallenge,
        automationGoals: formData.automationGoals,
        budgetRange: formData.budgetRange,
        timeline: formData.timeline,
        leadScore: qualification.score,
        leadCategory: qualification.category,
        source: "website",
        qualificationSummary: qualification.summary,
      },
      { dealStageLabel: dealStage }
    );
    integrationStatus.hubspot = hubspotResult.configured
      ? { ok: hubspotResult.ok, detail: hubspotResult.error }
      : { ok: false, detail: "not configured" };

    // 2. Resend: confirmation to the lead + internal notification.
    const calendlyUrl = getCalendlyEventUrl();
    const schedulingUrl = calendlyUrl
      ? buildCalendlyPrefillUrl(calendlyUrl, formData.fullName, formData.email)
      : null;

    const confirmation = getLeadReceivedEmail({
      name: formData.fullName,
      recommendedServices: qualification.recommendedServices.map((s) => s.service),
      schedulingUrl,
    });
    const leadEmailResult = await sendEmail({
      to: formData.email,
      subject: confirmation.subject,
      html: wrapHtmlEmail("Thanks for reaching out — you're one step closer to automation", textToHtml(confirmation.body)),
      text: confirmation.body,
    });
    integrationStatus.emailConfirmation = leadEmailResult.configured
      ? { ok: leadEmailResult.ok, detail: leadEmailResult.error }
      : { ok: false, detail: "not configured" };

    // Internal notification (to the business owner), if Resend is configured.
    const internalEmail = getInternalLeadNotificationEmail({
      leadName: formData.fullName,
      email: formData.email,
      businessName: formData.businessName,
      industry: formData.industry,
      leadScore: qualification.score,
      leadCategory: qualification.category,
      recommendedServices: qualification.recommendedServices.map((s) => s.service),
      summary: qualification.summary,
    });
    await sendEmail({
      to: COMPANY.email,
      subject: internalEmail.subject,
      html: wrapHtmlEmail("New lead received", textToHtml(internalEmail.body)),
      text: internalEmail.body,
    });

    return Response.json({
      success: true,
      message: "Thank you! We'll schedule your discovery call shortly.",
      leadId: newLead.id,
      qualification: {
        score: qualification.score,
        category: qualification.category,
        type: qualification.type,
        recommendedServices: qualification.recommendedServices,
        summary: qualification.summary,
      },
      meetingBrief,
      // Calendly scheduling link (from CALENDLY_EVENT_URL) — null if not configured.
      calendlyUrl: schedulingUrl,
      integrations: integrationStatus,
    });
  } catch (error: any) {
    console.error("Booking API error:", error);
    const msg = error?.message || String(error || "Unknown error");
    // Return a generic message to the user, but log the real error.
    // If it's a known third-party integration failure, give a more helpful hint.
    const userMsg = msg.includes("HubSpot") || msg.includes("Resend") || msg.includes("email")
      ? "We received your request but couldn't send the confirmation email. The Vyravo AI team will follow up with you directly."
      : "Something went wrong. Please try again.";
    return Response.json(
      { error: userMsg, _debug: process.env.NODE_ENV === "development" ? msg : undefined },
      { status: 500 }
    );
  }
}
