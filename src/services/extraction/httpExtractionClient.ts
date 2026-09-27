/**
 * The remote document-text extraction client.
 *
 * This is the real half of the extraction seam: it sends an uploaded PDF or DOCX
 * to the configured service and returns the text it answers with. It is
 * activated ONLY when a platform administrator has switched the extraction
 * capability to live and supplied an address and key; otherwise the platform
 * records the file by name and says so.
 *
 * It returns `null` for anything other than usable text, so the caller can report
 * what happened instead of rendering an empty document.
 */

import type { CapabilityConfig } from "@/config/platform";

/** Ask the configured service for a file's text. Null when no usable text came back. */
export const requestTextExtraction = async (
  file: File,
  config: CapabilityConfig,
): Promise<string | null> => {
  const body = new FormData();
  body.append("file", file, file.name);

  const response = await fetch(config.endpoint, {
    method: "POST",
    headers: { Authorization: `Bearer ${config.key.trim()}` },
    body,
  });
  if (!response.ok) return null;

  const payload: unknown = await response.json();
  if (typeof payload !== "object" || payload === null) return null;
  const text = (payload as { text?: unknown }).text;
  if (typeof text !== "string" || !text.trim()) return null;
  return text;
};
