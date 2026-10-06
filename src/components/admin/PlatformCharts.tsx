import type { ReactNode } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ChartDatum } from "@/services/admin/dashboardData";

const PRIMARY = "hsl(var(--primary))";
const GOLD = "hsl(var(--gold))";
const MUTED = "hsl(var(--muted-foreground))";

const AXIS = { fontSize: 10, fill: MUTED };
const SPLIT_COLORS = [PRIMARY, GOLD];

/** A round card with a title, an optional note, and a fixed-height chart area. */
function Panel({
  title,
  note,
  children,
}: {
  title: string;
  note?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-lg border bg-card p-4">
      <h3 className="text-xs font-semibold tracking-tight text-foreground">{title}</h3>
      {note && <p className="mt-0.5 text-[10px] text-muted-foreground">{note}</p>}
      <div className="mt-3 h-52 w-full">{children}</div>
    </section>
  );
}

const isEmpty = (data: ChartDatum[]) => data.every((d) => d.value === 0);

function Empty({ label }: { label: string }) {
  return (
    <div className="flex h-full items-center justify-center text-[11px] text-muted-foreground">
      {label}
    </div>
  );
}

/** A vertical bar chart of a count per department (or per category). */
export function BarPanel({
  title,
  note,
  data,
  color = PRIMARY,
  emptyLabel,
}: {
  title: string;
  note?: string;
  data: ChartDatum[];
  color?: string;
  emptyLabel: string;
}) {
  return (
    <Panel title={title} note={note}>
      {isEmpty(data) ? (
        <Empty label={emptyLabel} />
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 8, left: -22, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis dataKey="name" tick={AXIS} interval={0} angle={-40} textAnchor="end" height={46} />
            <YAxis tick={AXIS} allowDecimals={false} />
            <Tooltip contentStyle={{ fontSize: 11 }} />
            <Bar dataKey="value" fill={color} radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </Panel>
  );
}

/** An area chart of counts over time (grouped by a real recorded day). */
export function ActivityPanel({ data }: { data: ChartDatum[] }) {
  return (
    <Panel title="Activity over time" note="Simulation runs by the day they were recorded.">
      {isEmpty(data) ? (
        <Empty label="No runs recorded yet." />
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 8, left: -22, bottom: 0 }}>
            <defs>
              <linearGradient id="activityFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={PRIMARY} stopOpacity={0.35} />
                <stop offset="95%" stopColor={PRIMARY} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis dataKey="name" tick={AXIS} />
            <YAxis tick={AXIS} allowDecimals={false} />
            <Tooltip contentStyle={{ fontSize: 11 }} />
            <Area
              type="monotone"
              dataKey="value"
              stroke={PRIMARY}
              strokeWidth={2}
              fill="url(#activityFill)"
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </Panel>
  );
}

/** A donut split of two or more parts (e.g. published vs modelled). */
export function SplitPanel({
  title,
  note,
  data,
  colors = SPLIT_COLORS,
}: {
  title: string;
  note?: string;
  data: ChartDatum[];
  colors?: string[];
}) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  return (
    <Panel title={title} note={note}>
      {total === 0 ? (
        <Empty label="Nothing recorded yet." />
      ) : (
        <div className="flex h-full items-center">
          <ResponsiveContainer width="55%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                innerRadius="55%"
                outerRadius="85%"
                paddingAngle={2}
                stroke="none"
              >
                {data.map((entry, index) => (
                  <Cell key={entry.name} fill={colors[index % colors.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
          <ul className="flex-1 space-y-1 pl-2">
            {data.map((entry, index) => (
              <li key={entry.name} className="flex items-center gap-2 text-[11px] text-foreground">
                <span
                  className="inline-block h-2.5 w-2.5 rounded-sm"
                  style={{ backgroundColor: colors[index % colors.length] }}
                />
                <span className="flex-1">{entry.name}</span>
                <span className="font-mono text-muted-foreground">{entry.value}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Panel>
  );
}

