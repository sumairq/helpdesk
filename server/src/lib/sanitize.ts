import { JSDOM } from "jsdom";
import DOMPurify from "dompurify";

const { window } = new JSDOM("");
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const purify = DOMPurify(window as any);

export function sanitizeHtml(dirty: string): string {
  return purify.sanitize(dirty, { USE_PROFILES: { html: true } });
}
