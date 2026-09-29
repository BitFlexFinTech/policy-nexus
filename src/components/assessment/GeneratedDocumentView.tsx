import type { GeneratedDocument } from "@/services/assessment/types";

/**
 * Presentation of a generated document (the long-form report or the drafted
 * policy). One renderer for both, so they share a single typographic treatment
 * and the printed page matches the screen (see the `@media print` rules in
 * `src/index.css`). Presentational only — the page supplies the header and the
 * document actions.
 */
export function GeneratedDocumentView({ document: doc }: { document: GeneratedDocument }) {
  return (
    <article className="rounded-lg border bg-card">
      <header className="border-b px-4 py-3">
        <h3 className="text-sm font-semibold tracking-tight text-foreground">{doc.title}</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">{doc.subtitle}</p>
      </header>

      <div className="space-y-5 p-4">
        {doc.sections.map((section) => (
          <section key={section.id} data-doc-section={section.id} className="space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {section.heading}
            </h4>

            {section.paragraphs.map((paragraph, index) => (
              <p key={index} className="max-w-4xl text-xs leading-relaxed text-foreground">
                {paragraph}
              </p>
            ))}

            {section.bullets && section.bullets.length > 0 && (
              <ul className="space-y-1">
                {section.bullets.map((bullet, index) => (
                  <li key={index} className="flex gap-2 text-xs leading-relaxed text-foreground">
                    <span className="shrink-0 font-mono text-[10px] text-muted-foreground">
                      {section.listStyle === "clauses" ? `${index + 1}.` : "•"}
                    </span>
                    <span className="max-w-4xl">{bullet}</span>
                  </li>
                ))}
              </ul>
            )}

            {section.table && (
              <figure className="space-y-1">
                <figcaption className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                  {section.table.caption}
                </figcaption>
                {/* A policy is read by its matrices, so the table is a real table with a
                    header row and scoped column headers — not styled divs. */}
                <div className="overflow-x-auto rounded-md border">
                  <table className="w-full border-collapse text-left text-[11px]">
                    <thead>
                      <tr className="bg-muted/50">
                        {section.table.columns.map((column) => (
                          <th
                            key={column}
                            scope="col"
                            className="border-b px-2 py-1 font-semibold text-foreground"
                          >
                            {column}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {section.table.rows.map((row, rowIndex) => (
                        <tr key={rowIndex} className="align-top">
                          {row.map((cell, cellIndex) => (
                            <td
                              key={cellIndex}
                              className="border-b border-dashed px-2 py-1 leading-relaxed text-foreground"
                            >
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </figure>
            )}
          </section>
        ))}
      </div>
    </article>
  );
}
