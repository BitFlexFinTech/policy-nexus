/**
 * Derived platform-coverage figures.
 *
 * Computed from the authored configuration so that no screen can ever state a
 * figure the platform does not actually hold. One definition, used by the public
 * chrome and the landing page alike.
 * (see .clinerules/03-single-source-of-truth.md)
 */

import { DEPARTMENT_COUNT, DEPARTMENTS } from "@/config/departments";
import { STAKEHOLDER_SEGMENTS } from "@/config/reference";

export const COVERAGE = {
  departments: DEPARTMENT_COUNT,
  groups: STAKEHOLDER_SEGMENTS.length,
  indicators: DEPARTMENTS.reduce((total, department) => total + department.indicators.length, 0),
  drafts: DEPARTMENTS.reduce((total, department) => total + department.policyTemplates.length, 0),
} as const;
