import { beforeEach, describe, expect, it } from "vitest";
import { DEFAULT_CONTENT, getContent, saveContent } from "@/config/content";
import { DEFAULT_PLATFORM_CONFIG, getConfig, saveConfig } from "@/config/platform";
import { BROWSER_DATA_PREFIX, clearAllBrowserData } from "@/lib/browserData";
import { DEFAULT_LEVERS } from "@/services/assessment/levers";
import { listRunRequests } from "@/services/assessment/runStore";
import {
  addDepartmentDocument,
  listDepartmentDocuments,
} from "@/services/documents/departmentDocuments";
import { getDraftText, saveDraftText } from "@/services/documents/draftStore";
import { getPolicyInput, savePolicyInput } from "@/services/documents/policyInputStore";
import { listSupportCases, openSupportCase } from "@/services/support/supportStore";
import { getSession, signInToDepartment } from "@/session/session";

/** Every key the platform wrote into one storage area. */
const platformKeysIn = (area: Storage): string[] => {
  const keys: string[] = [];
  for (let index = 0; index < area.length; index += 1) {
    const key = area.key(index);
    if (key?.startsWith(BROWSER_DATA_PREFIX)) keys.push(key);
  }
  return keys;
};

/** Put one record into every store through that store's own public seam. */
const seedEverything = () => {
  signInToDepartment("fin");
  saveContent({ text: { "landing.title": "Changed for the test" }, logo: "", favicon: "" });
  saveDraftText("fin-run", "Officer wording");
  savePolicyInput({ departmentId: "fin", text: "Draft text", levers: DEFAULT_LEVERS, files: [] });
  addDepartmentDocument({
    departmentId: "fin",
    name: "budget.xlsx",
    sizeLabel: "4 KB",
    kind: "xlsx",
    text: "a row",
    status: "read",
  });
  openSupportCase({ departmentId: "fin", subject: "Help", category: "Other", description: "x" });
  window.sessionStorage.setItem("nzwisiso.sso.state.v1", "abc");
  window.sessionStorage.setItem("nzwisiso.sso.verifier.v1", "xyz");
  // A key a FUTURE store might add, to prove the sweep clears what the named resets do not name.
  window.localStorage.setItem(`${BROWSER_DATA_PREFIX}future-thing.v1`, "leftover");
};

describe("clearing this browser's saved data", () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  it("forgets every store, leaves no platform key behind, and signs the department out", () => {
    seedEverything();
    // A sanity check that the seed really took, so the assertions below cannot pass on an empty slate.
    expect(platformKeysIn(window.localStorage).length).toBeGreaterThan(4);
    expect(getSession()).not.toBeNull();

    clearAllBrowserData();

    expect(platformKeysIn(window.localStorage)).toEqual([]);
    expect(getSession()).toBeNull();
    expect(getContent()).toEqual(DEFAULT_CONTENT);
    expect(getDraftText("fin-run")).toBeNull();
    expect(getPolicyInput("fin")).toBeUndefined();
    expect(listDepartmentDocuments("fin")).toHaveLength(0);
    expect(listSupportCases()).toHaveLength(0);
    expect(listRunRequests()).toHaveLength(0);
    expect(window.sessionStorage.getItem("nzwisiso.sso.state.v1")).toBeNull();
    expect(window.sessionStorage.getItem("nzwisiso.sso.verifier.v1")).toBeNull();
  });

  it("returns the platform configuration to how it ships", () => {
    saveConfig({ ...getConfig(), platformMode: "live" });
    expect(getConfig().platformMode).toBe("live");

    clearAllBrowserData();

    expect(getConfig()).toEqual(DEFAULT_PLATFORM_CONFIG);
  });

  it("keeps this tab's administrator answer, so the screen is not locked mid-reset", () => {
    window.sessionStorage.setItem("nzwisiso.admin.ack.v1", "confirmed");

    clearAllBrowserData();

    expect(window.sessionStorage.getItem("nzwisiso.admin.ack.v1")).toBe("confirmed");
  });
});
