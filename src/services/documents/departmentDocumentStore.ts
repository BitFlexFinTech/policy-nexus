/**
 * THE LIBRARY SEAM — where a department's own documents are kept.
 *
 * Mock-first, exactly like every other capability in this platform. Today the documents
 * are kept in THIS BROWSER by the **Local** client, and every run of that department
 * reads them; that is the state the platform ships in and the state that needs no server.
 * When a shared server exists, a platform administrator enters its address and key on the
 * administration screen (nothing else), and the SAME screens start using the **Shared**
 * client — no code change anywhere. If it needed more than an address and a key, the seam
 * would be wrong.
 *
 * HONEST ABOUT THE LIMIT: the Local client is browser-only. It is shared with nobody —
 * not another officer, not another machine — and it says so in plain words on the surface
 * that uses it. The Shared client is the ONLY way documents are shared, and there is no
 * server yet, so the platform never claims a library is shared while it is Local.
 *
 * The browser copy stays the working copy the screen renders from, so a run still works
 * with no connection; the Shared client makes the server authoritative and keeps that
 * copy in step. Nothing here invents a document: a write that the server refuses is
 * reported, never shown as saved.
 */

import {
  describeCapability,
  getConfig,
  type CapabilityConfig,
  type PlatformConfig,
} from "@/config/platform";
import {
  addDepartmentDocument,
  clearDepartmentDocuments,
  listDepartmentDocuments,
  removeDepartmentDocument,
  type DepartmentDocumentRecord,
} from "./departmentDocuments";

/** A document on its way in — everything but the id and the date, which the store adds. */
export type DepartmentDocumentInputRecord = Omit<DepartmentDocumentRecord, "id" | "addedAt">;

/** Which surface a department's documents are kept on. */
export type LibraryMode = "local" | "shared";

export interface DepartmentDocumentStore {
  /** `local` = this browser only; `shared` = a department server. */
  readonly mode: LibraryMode;
  /** A short plain label for the surface in use. */
  readonly label: string;
  /** One plain sentence stating this surface's honest limit. */
  readonly limitation: string;
  /** The documents this department has added, newest first. */
  list(departmentId: string | null | undefined): readonly DepartmentDocumentRecord[];
  /** Keep a document. The Local client resolves at once; the Shared client sends it first. */
  add(record: DepartmentDocumentInputRecord): Promise<DepartmentDocumentRecord>;
  remove(id: string): Promise<void>;
  clear(departmentId: string): Promise<void>;
}

/* ------------------------------------------------------------------------- */
/* Local — the mock. This is what runs today.                                  */
/* ------------------------------------------------------------------------- */

/** The honest description of the browser-only surface, shown wherever it is used. */
export const LOCAL_LIBRARY_LABEL = "This browser (Local)";
export const LOCAL_LIBRARY_LIMITATION =
  "Kept in this browser, for this department only. Shared with nobody — not another officer, not another machine — and lost if this browser's stored data is cleared.";

export const LOCAL_LIBRARY_STORE: DepartmentDocumentStore = {
  mode: "local",
  label: LOCAL_LIBRARY_LABEL,
  limitation: LOCAL_LIBRARY_LIMITATION,
  list: (departmentId) => listDepartmentDocuments(departmentId),
  add: async (record) => addDepartmentDocument(record),
  remove: async (id) => {
    removeDepartmentDocument(id);
  },
  clear: async (departmentId) => {
    clearDepartmentDocuments(departmentId);
  },
};

/* ------------------------------------------------------------------------- */
/* Shared — the real client. Used only when a server is completely configured. */
/* ------------------------------------------------------------------------- */

const trimTrailingSlash = (value: string): string => value.replace(/\/+$/, "");

/**
 * The HTTP client for a department's shared library. It is complete: it sends exactly
 * the record the Local client stores, and it treats any non-2xx answer as a failure
 * rather than pretending the document was kept.
 *
 * The browser copy is written first and the server second, so the screen never blocks
 * and a run works with no connection. When the server refuses, the error is raised and
 * the surface reports it — the copy is the working copy, not a claim the server agreed.
 */
export const createSharedLibraryStore = (config: CapabilityConfig): DepartmentDocumentStore => {
  const base = trimTrailingSlash(config.endpoint.trim());
  const headers = (): Record<string, string> => ({
    "content-type": "application/json",
    Authorization: `Bearer ${config.key.trim()}`,
  });

  const call = async (path: string, init: RequestInit): Promise<void> => {
    const response = await fetch(`${base}${path}`, { ...init, headers: headers() });
    if (!response.ok) {
      throw new Error(`The document library server answered ${response.status}.`);
    }
  };

  return {
    mode: "shared",
    label: "Your department's shared library (server)",
    limitation:
      "Sent to your department's library server, so every officer and every machine sees them. This browser keeps a copy so a run still works with no connection.",
    list: (departmentId) => listDepartmentDocuments(departmentId),
    add: async (record) => {
      const saved = addDepartmentDocument(record);
      await call("", {
        method: "POST",
        body: JSON.stringify({ document: record }),
      });
      return saved;
    },
    remove: async (id) => {
      removeDepartmentDocument(id);
      await call(`/${encodeURIComponent(id)}`, { method: "DELETE" });
    },
    clear: async (departmentId) => {
      clearDepartmentDocuments(departmentId);
      await call(`?department=${encodeURIComponent(departmentId)}`, { method: "DELETE" });
    },
  };
};

/* ------------------------------------------------------------------------- */
/* The chooser                                                                 */
/* ------------------------------------------------------------------------- */

/**
 * The store for the given configuration. A library is only Shared when the capability is
 * COMPLETELY configured (address and key); anything less falls back to Local rather than
 * half-working, exactly like the platform's other capabilities.
 */
export const departmentDocumentStoreFor = (config: PlatformConfig): DepartmentDocumentStore =>
  describeCapability(config, "library").state === "live"
    ? createSharedLibraryStore(config.library)
    : LOCAL_LIBRARY_STORE;

/** The store for the current configuration. */
export const getDepartmentDocumentStore = (): DepartmentDocumentStore =>
  departmentDocumentStoreFor(getConfig());

/** True when the current store shares documents with a server. */
export const isLibraryShared = (config: PlatformConfig): boolean =>
  departmentDocumentStoreFor(config).mode === "shared";
