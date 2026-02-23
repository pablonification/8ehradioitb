// Canonical route namespace for event pages.
// "events" is reserved in middleware.ts so these paths bypass shortlink rewrite.
export const EVENTS_BASE = "/events";

/**
 * Returns the canonical registration path for a given event slug.
 * e.g. eventRegisterPath("itb-open-day-2026") → "/events/itb-open-day-2026/register"
 */
export function eventRegisterPath(eventSlug) {
  return `${EVENTS_BASE}/${eventSlug}/register`;
}

/**
 * Returns the canonical detail path for a given event slug.
 * e.g. eventDetailPath("itb-open-day-2026") → "/events/itb-open-day-2026"
 */
export function eventDetailPath(eventSlug) {
  return `${EVENTS_BASE}/${eventSlug}`;
}
