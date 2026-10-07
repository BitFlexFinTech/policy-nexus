import { useEffect, useSyncExternalStore } from "react";
import { seedResearchSample } from "@/services/research/researchSample";
import {
  getResearchDocumentsServerSnapshot,
  getResearchDocumentsSnapshot,
  subscribeToResearchDocuments,
} from "@/services/research/researchDocuments";
import {
  getResearchDataSourcesServerSnapshot,
  getResearchDataSourcesSnapshot,
  subscribeToResearchDataSources,
} from "@/services/research/researchDataSources";
import {
  getResearchBarometerServerSnapshot,
  getResearchBarometerSnapshot,
  subscribeToResearchBarometer,
} from "@/services/research/researchBarometer";
import {
  getResearchFindingsServerSnapshot,
  getResearchFindingsSnapshot,
  subscribeToResearchFindings,
} from "@/services/research/researchFindings";

/**
 * The demonstration sample, read live from the research product's own stores.
 *
 * A design option must be judged against the real content the assistant actually ships with — real
 * library extracts, real published barometer figures, real findings — never against invented
 * placeholder copy. It seeds the sample on first open, exactly as the workspace shell does.
 */
export function useDesignSample() {
  useEffect(() => {
    seedResearchSample();
  }, []);

  const documents = useSyncExternalStore(
    subscribeToResearchDocuments,
    getResearchDocumentsSnapshot,
    getResearchDocumentsServerSnapshot,
  );
  const sources = useSyncExternalStore(
    subscribeToResearchDataSources,
    getResearchDataSourcesSnapshot,
    getResearchDataSourcesServerSnapshot,
  );
  const readings = useSyncExternalStore(
    subscribeToResearchBarometer,
    getResearchBarometerSnapshot,
    getResearchBarometerServerSnapshot,
  );
  const findings = useSyncExternalStore(
    subscribeToResearchFindings,
    getResearchFindingsSnapshot,
    getResearchFindingsServerSnapshot,
  );

  const indicators = new Set(readings.map((reading) => reading.indicator)).size;

  return {
    documents,
    sources,
    readings,
    findings,
    counts: {
      documents: documents.length,
      sources: sources.length,
      indicators,
      findings: findings.length,
    },
  };
}
