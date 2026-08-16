import { qualifyLead, generateMeetingBrief } from "../src/lib/discovery/scoring";
import { getCalendlyEventUrl } from "../src/lib/integrations/calendly";
import { db } from "../src/db/index";
import { leads } from "../src/db/schema";

async function main() {
  console.log("CALENDLY_EVENT_URL set:", Boolean(process.env.CALENDLY_EVENT_URL));
  console.log("Calendly URL:", getCalendlyEventUrl());

  const formData: any = { fullName: "Test", email: "a@b.c", phone: "+91 123" };
  const q = qualifyLead(formData);
  console.log("Qualify OK, score:", q.score);

  try {
    const r = await db.insert(leads).values({
      fullName: "DB Test", email: "dbtest@example.com", phone: null,
      leadScore: q.score, leadCategory: q.category, leadType: q.type,
      recommendedServices: q.recommendedServices.map((s: any) => s.service),
      qualificationSummary: q.summary,
      meetingBrief: generateMeetingBrief(formData, q),
      source: "test",
    }).returning({ id: leads.id });
    console.log("DB insert OK, id:", r[0].id);
  } catch (e: any) {
    console.log("DB insert FAILED:", e.message?.slice(0, 200));
  }
  process.exit(0);
}
main().catch(console.error);
