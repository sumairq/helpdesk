import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface DailyCount {
  date: string;
  count: number;
}

interface DailyTicketsChartProps {
  data: DailyCount[];
  isPending: boolean;
}

function formatAxisDate(date: string): string {
  return new Date(date + "T00:00:00Z").toLocaleDateString(undefined, { month: "short", day: "numeric", timeZone: "UTC" });
}

export function DailyTicketsChart({ data, isPending }: DailyTicketsChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-medium">Tickets per Day (Last 30 Days)</CardTitle>
      </CardHeader>
      <CardContent>
        {isPending ? (
          <Skeleton className="h-64 w-full" />
        ) : (
          <ResponsiveContainer width="100%" height={256}>
            <BarChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
              <XAxis
                dataKey="date"
                tickFormatter={formatAxisDate}
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                labelFormatter={(label) => formatAxisDate(label as string)}
                formatter={(value) => [value, "Tickets"]}
                cursor={{ fill: "hsl(var(--muted))" }}
              />
              <Bar dataKey="count" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
