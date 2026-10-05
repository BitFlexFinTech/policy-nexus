import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  DEFAULT_PLATFORM_CONFIG,
  clearConfig,
  saveConfig,
  type PlatformConfig,
} from "@/config/platform";
import { listDepartmentDocuments } from "@/services/documents/departmentDocuments";
import {
  LOCAL_LIBRARY_LABEL,
  LOCAL_LIBRARY_STORE,
  departmentDocumentStoreFor,
  getDepartmentDocumentStore,
} from "@/services/documents/departmentDocumentStore";

/** A local address, so this file carries no reachable remote address at all. */
const ENDPOINT = "http://localhost:8787/library";

const configured = (): PlatformConfig => ({
  ...DEFAULT_PLATFORM_CONFIG,
  library: { mode: "live", endpoint: ENDPOINT, key: "test-key", model: "" },
});

const documentInput = () => ({
  departmentId: "fin" as const,
  name: "note.txt",
  sizeLabel: "11 characters",
  kind: "text" as const,
  text: "hello there",
  status: "Text added directly — read in full.",
});

/**
 * The document-library seam (Batch 3, mock-first).
 *
 * These gates hold the promise: the platform keeps a department's documents in this
 * browser by default and says so plainly; it makes NO request while the library is not
 * configured; and entering a server address and key is the ONLY step needed to switch the
 * same screens to the shared client, with a refusal reported rather than hidden.
 */
describe("the document-library seam (mock-first)", () => {
  beforeEach(() => {
    window.localStorage.clear();
    clearConfig();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    clearConfig();
  });

  it("keeps documents in this browser by default, and states the limit plainly", async () => {
    const store = getDepartmentDocumentStore();
    expect(store.mode).toBe("local");
    expect(store.label).toBe(LOCAL_LIBRARY_LABEL);
    expect(store.limitation).toMatch(/Shared with nobody/);

    await store.add(documentInput());
    expect(listDepartmentDocuments("fin")).toHaveLength(1);
    expect(store.list("fin")).toHaveLength(1);
  });

  it("makes NO request at all while the library is not configured", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const store = getDepartmentDocumentStore();
    await store.add(documentInput());
    await store.remove(store.list("fin")[0].id);
    await store.clear("fin");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("switches to the shared client purely by configuration, and back again", () => {
    expect(getDepartmentDocumentStore()).toBe(LOCAL_LIBRARY_STORE);

    saveConfig(configured());
    const shared = getDepartmentDocumentStore();
    expect(shared.mode).toBe("shared");
    expect(shared.label).not.toBe(LOCAL_LIBRARY_LABEL);
    expect(shared.limitation).toMatch(/server/);

    clearConfig();
    expect(getDepartmentDocumentStore()).toBe(LOCAL_LIBRARY_STORE);
  });

  it("sends a document to the server with the credential, and never hides a refusal", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 204 } as Response);
    vi.stubGlobal("fetch", fetchMock);
    saveConfig(configured());
    const store = getDepartmentDocumentStore();

    await store.add(documentInput());
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(String(url)).toBe(ENDPOINT);
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer test-key");

    // A server that refuses is reported, never shown as saved.
    fetchMock.mockResolvedValue({ ok: false, status: 500 } as Response);
    await expect(store.add(documentInput())).rejects.toThrow(/answered 500/);
  });

  it("falls back to the browser when the library is only half-configured", () => {
    const half: PlatformConfig = {
      ...DEFAULT_PLATFORM_CONFIG,
      library: { mode: "live", endpoint: ENDPOINT, key: "", model: "" },
    };
    expect(departmentDocumentStoreFor(half)).toBe(LOCAL_LIBRARY_STORE);
  });
});
