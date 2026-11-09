/**
 * The flash announcement of the home page, managed from the backoffice
 * (/annonces). A failure is not an error for the page: without data nothing
 * is shown.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v1";

export interface Announcement {
  id: number;
  title: string;
  image_url: string;
  link_url: string | null;
  /** Size of the pop-up in px (reduced to fit small screens). */
  width: number;
  height: number;
  /** Seconds after arriving on the page before it appears. */
  delay_seconds: number;
  /** Visits on which it is shown to a visitor; null = until the visitor closes it. */
  max_displays: number | null;
  /** Changes when the announcement is edited. */
  version: number | null;
}

/** The announcement to show now (the newest one running), or null. */
export async function getCurrentAnnouncement(): Promise<Announcement | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/announcements`, { next: { revalidate: 60 } });
    if (!response.ok) return null;
    const list = (await response.json()) as Announcement[];
    return list[0] ?? null;
  } catch {
    return null;
  }
}

export const STATE_KEY = "TechLium_announcement_state";
export const SESSION_KEY = "TechLium_announcement_session";

/** What a browser remembers about one announcement (localStorage). */
export interface DisplayState {
  id: number;
  version: number | null;
  /** Visits on which it was shown. */
  shown: number;
  /** Closed for good (only for announcements without a display count). */
  closed: boolean;
}

type Identity = Pick<Announcement, "id" | "version" | "max_displays">;

function parseState(announcement: Identity, stored: string | null): DisplayState {
  const fresh: DisplayState = { id: announcement.id, version: announcement.version ?? null, shown: 0, closed: false };
  if (!stored) return fresh;

  try {
    const value = JSON.parse(stored) as Partial<DisplayState> | null;
    // Another announcement, or the same one after an edit: counted from zero again.
    if (value?.id !== announcement.id || (value.version ?? null) !== fresh.version) return fresh;
    return { ...fresh, shown: Number(value.shown) || 0, closed: value.closed === true };
  } catch {
    return fresh;
  }
}

function sessionTag(announcement: Identity, status: "shown" | "closed"): string {
  return `${announcement.id}:${announcement.version ?? ""}:${status}`;
}

export interface Decision {
  show: boolean;
  /** New localStorage value to write, or null to leave it. */
  state: string | null;
  /** New sessionStorage value to write, or null to leave it. */
  session: string | null;
}

/**
 * Whether to show the announcement on this page load.
 * - Without a display count: shown until the visitor closes it.
 * - With a display count N: shown on the first N visits (a visit = a browser session, so reloads and
 *   other pages of the same visit do not count again); closing only closes it for the current visit.
 */
export function decideDisplay(announcement: Identity, stored: string | null, session: string | null): Decision {
  const state = parseState(announcement, stored);
  const hide: Decision = { show: false, state: null, session: null };

  if (announcement.max_displays === null) {
    return state.closed ? hide : { show: true, state: null, session: null };
  }

  if (session === sessionTag(announcement, "closed")) return hide;
  if (session === sessionTag(announcement, "shown")) return { show: true, state: null, session: null };
  if (state.shown >= announcement.max_displays) return hide;

  return { show: true, state: JSON.stringify({ ...state, shown: state.shown + 1 } satisfies DisplayState), session: sessionTag(announcement, "shown") };
}

/** What to remember when the visitor closes it (or follows its link). */
export function closeDecision(announcement: Identity, stored: string | null): Pick<Decision, "state" | "session"> {
  if (announcement.max_displays === null) {
    return { state: JSON.stringify({ ...parseState(announcement, stored), closed: true } satisfies DisplayState), session: null };
  }

  return { state: null, session: sessionTag(announcement, "closed") };
}
