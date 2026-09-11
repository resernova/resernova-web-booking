// @ts-nocheck — Deno runtime; Next.js tsc ignores
/**
 * Shared: ICS (iCalendar) generator — used by web-booking-notify Edge Function.
 * RFC 5545 subset. Mirrors lib/utils/ics.ts on the Next.js side (Deno-safe port).
 */

export type IcsEvent = {
  uid: string;
  summary: string;
  description?: string;
  location?: string;
  startIso: string;
  endIso: string;
  organizerName: string;
  organizerEmail?: string;
  attendeeName: string;
  attendeeEmail?: string;
};

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

function toIcsDate(iso: string): string {
  const d = new Date(iso);
  return (
    d.getUTCFullYear().toString() +
    pad(d.getUTCMonth() + 1) +
    pad(d.getUTCDate()) +
    "T" +
    pad(d.getUTCHours()) +
    pad(d.getUTCMinutes()) +
    pad(d.getUTCSeconds()) +
    "Z"
  );
}

function escapeIcs(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

function foldLine(line: string): string {
  if (line.length <= 73) return line;
  const chunks: string[] = [];
  let i = 0;
  while (i < line.length) {
    chunks.push(line.slice(i, i + 73));
    i += 73;
  }
  return chunks.join("\r\n ");
}

export function buildIcs(event: IcsEvent): string {
  const dtstamp = toIcsDate(new Date().toISOString());
  const dtstart = toIcsDate(event.startIso);
  const dtend = toIcsDate(event.endIso);

  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//ReserNova//Web Booking//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    foldLine(`UID:${event.uid}@resernova.com`),
    `DTSTAMP:${dtstamp}`,
    `DTSTART:${dtstart}`,
    `DTEND:${dtend}`,
    foldLine(`SUMMARY:${escapeIcs(event.summary)}`),
  ];

  if (event.description)
    lines.push(foldLine(`DESCRIPTION:${escapeIcs(event.description)}`));
  if (event.location)
    lines.push(foldLine(`LOCATION:${escapeIcs(event.location)}`));

  lines.push(
    foldLine(
      `ORGANIZER;CN=${escapeIcs(event.organizerName)}${event.organizerEmail ? `:mailto:${event.organizerEmail}` : ""}`,
    ),
  );
  lines.push(
    foldLine(
      `ATTENDEE;CN=${escapeIcs(event.attendeeName)};RSVP=TRUE${event.attendeeEmail ? `:mailto:${event.attendeeEmail}` : ""}`,
    ),
  );
  lines.push("STATUS:CONFIRMED");
  lines.push("TRANSP:OPAQUE");
  lines.push("END:VEVENT");
  lines.push("END:VCALENDAR");

  return lines.join("\r\n") + "\r\n";
}
