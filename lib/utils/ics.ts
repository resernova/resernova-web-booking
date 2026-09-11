/**
 * ICS (iCalendar) generator for booking confirmation downloads.
 * RFC 5545 compliant — minimal subset needed for Apple Calendar / Google Calendar / Outlook.
 */

export type IcsEvent = {
  uid: string;
  summary: string;
  description?: string;
  location?: string;
  startIso: string; // ISO 8601 with timezone offset (e.g., "2026-08-15T10:00:00+01:00")
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
  // Convert "2026-08-15T10:00:00+01:00" → "20260815T090000Z" (UTC, basic format)
  const d = new Date(iso);
  if (isNaN(d.getTime())) throw new Error(`Invalid ISO date: ${iso}`);
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
  // RFC 5545: lines should be folded at 75 octets. Simplified to 73 chars + " " indent.
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

  if (event.description) {
    lines.push(foldLine(`DESCRIPTION:${escapeIcs(event.description)}`));
  }
  if (event.location) {
    lines.push(foldLine(`LOCATION:${escapeIcs(event.location)}`));
  }

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
