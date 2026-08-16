import { getCalendlyEventUrl, isCalendlyConfigured } from "@/lib/integrations/calendly";
import { isResendConfigured } from "@/lib/integrations/resend";
import { isHubSpotConfigured } from "@/lib/integrations/hubspot";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({
    calendly: { configured: isCalendlyConfigured(), url: getCalendlyEventUrl() },
    resend: { configured: isResendConfigured() },
    hubspot: { configured: isHubSpotConfigured() },
  });
}
