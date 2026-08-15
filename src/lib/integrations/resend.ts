// Resend email integration (server-side only).
// Requires: RESEND_API_KEY and RESEND_FROM_EMAIL (Vercel env vars).

const RESEND_API = "https://api.resend.com";

export function isResendConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY?.trim() && process.env.RESEND_FROM_EMAIL?.trim());
}

export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface SendEmailResult {
  configured: boolean;
  ok: boolean;
  id?: string;
  error?: string;
}

/** Send a single email via the Resend API. Never throws — returns status. */
export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.RESEND_FROM_EMAIL?.trim();

  if (!apiKey || !from) {
    return {
      configured: false,
      ok: false,
      error: !apiKey ? "RESEND_API_KEY not configured" : "RESEND_FROM_EMAIL not configured",
    };
  }

  const to = input.to.trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
    return { configured: true, ok: false, error: "Invalid recipient email address" };
  }
  if (!input.subject.trim() || !input.html.trim()) {
    return { configured: true, ok: false, error: "Subject and HTML body are required" };
  }

  try {
    const res = await fetch(`${RESEND_API}/emails`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject: input.subject.trim(),
        html: input.html,
        ...(input.text ? { text: input.text } : {}),
      }),
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      const message = data?.message || data?.error || `Resend API error (${res.status})`;
      console.error("Resend send failed:", message);
      return { configured: true, ok: false, error: String(message) };
    }

    return { configured: true, ok: true, id: data?.id };
  } catch (error) {
    console.error("Resend send error:", error);
    return {
      configured: true,
      ok: false,
      error: String(error instanceof Error ? error.message : error),
    };
  }
}

/** Minimal branded HTML wrapper matching the Vyravo dark theme. */
export function wrapHtmlEmail(title: string, bodyHtml: string): string {
  return `<!DOCTYPE html>
<html>
  <body style="margin:0;padding:0;background-color:#0A0A0F;font-family:Inter,Arial,sans-serif;">
    <div style="max-width:600px;margin:0 auto;padding:32px 16px;">
      <div style="background-color:#12121A;border:1px solid #26263A;border-radius:16px;padding:32px;">
        <div style="margin-bottom:24px;">
          <span style="font-size:20px;font-weight:700;color:#FFFFFF;">Vyravo</span>
          <span style="font-size:16px;color:#9CA3AF;"> AI</span>
        </div>
        <h1 style="font-size:20px;color:#FFFFFF;margin:0 0 16px;">${title}</h1>
        <div style="font-size:14px;line-height:1.7;color:#C4C4CC;">${bodyHtml}</div>
        <div style="margin-top:32px;padding-top:24px;border-top:1px solid #26263A;font-size:12px;color:#6B7280;">
          Vyravo AI — Intelligent Automation for Modern Businesses<br/>
          This email was sent by Vyravo AI. If you have questions, simply reply to this email.
        </div>
      </div>
    </div>
  </body>
</html>`;
}

/** Convert plain-text email bodies (with \n and emoji) into safe HTML paragraphs. */
export function textToHtml(text: string): string {
  const escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return escaped
    .split(/\n\n+/)
    .map((block) => `<p style="margin:0 0 14px;">${block.replace(/\n/g, "<br/>")}</p>`)
    .join("");
}
