// @ts-nocheck — Deno runtime; Next.js tsc ignores
/**
 * Shared: Resend email sender — used by web-booking-notify Edge Function.
 * Loads API key + from address from Deno.env (set via `supabase secrets set`).
 */

export type SendEmailParams = {
  to: string;
  subject: string;
  html: string;
  text?: string;
  attachments?: Array<{
    filename: string;
    content: string;
    contentType?: string;
  }>;
};

export async function sendEmail(params: SendEmailParams): Promise<string> {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  const from =
    Deno.env.get("RESEND_FROM_EMAIL") ?? "ReserNova <bookings@resernova.com>";
  if (!apiKey) throw new Error("RESEND_API_KEY not configured");

  const body: Record<string, unknown> = {
    from,
    to: [params.to],
    subject: params.subject,
    html: params.html,
    text: params.text ?? stripHtml(params.html),
  };

  if (params.attachments?.length) {
    body.attachments = params.attachments.map((a) => ({
      filename: a.filename,
      content:
        typeof a.content === "string"
          ? btoa(unescape(encodeURIComponent(a.content))) // base64-encode for JSON transport
          : "",
      content_type: a.contentType ?? "application/octet-stream",
    }));
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Resend API ${res.status}: ${err}`);
  }
  const json = await res.json();
  return json.id ?? "ok";
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}
