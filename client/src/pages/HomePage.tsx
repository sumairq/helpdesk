import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import { BotIcon, ClockIcon, InboxIcon, TicketIcon, ZapIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { DailyTicketsChart } from "@/components/DailyTicketsChart";

interface DailyCount {
  date: string;
  count: number;
}

interface TicketStats {
  totalTickets: number;
  openTickets: number;
  aiResolvedTickets: number;
  aiResolvedPercent: number;
  avgResolutionMs: number | null;
  dailyTickets: DailyCount[];
}

async function fetchStats(): Promise<TicketStats> {
  const res = await axios.get<TicketStats>("/api/tickets/stats", { withCredentials: true });
  return res.data;
}

function formatDuration(ms: number): string {
  const minutes = Math.round(ms / 60_000);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.round(ms / 3_600_000);
  if (hours < 24) return `${hours}h`;
  return `${Math.round(ms / 86_400_000)}d`;
}

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
}

function StatCard({ title, value, icon }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <span className="text-muted-foreground">{icon}</span>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-bold">{value}</p>
      </CardContent>
    </Card>
  );
}

function StatCardSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <Skeleton className="h-4 w-32" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-9 w-20" />
      </CardContent>
    </Card>
  );
}

export function HomePage() {
  const { data: stats, isPending, error } = useQuery({
    queryKey: ["stats"],
    queryFn: fetchStats,
  });

  return (
    <main className="p-8 space-y-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>

      {error && <ErrorMessage message="Failed to load stats." />}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {isPending ? (
          Array.from({ length: 5 }).map((_, i) => <StatCardSkeleton key={i} />)
        ) : stats ? (
          <>
            <StatCard
              title="Total Tickets"
              value={stats.totalTickets.toLocaleString()}
              icon={<TicketIcon className="h-4 w-4" />}
            />
            <StatCard
              title="Open Tickets"
              value={stats.openTickets.toLocaleString()}
              icon={<InboxIcon className="h-4 w-4" />}
            />
            <StatCard
              title="Resolved by AI"
              value={stats.aiResolvedTickets.toLocaleString()}
              icon={<BotIcon className="h-4 w-4" />}
            />
            <StatCard
              title="AI Resolution Rate"
              value={`${stats.aiResolvedPercent}%`}
              icon={<ZapIcon className="h-4 w-4" />}
            />
            <StatCard
              title="Avg Resolution Time"
              value={stats.avgResolutionMs != null ? formatDuration(stats.avgResolutionMs) : "—"}
              icon={<ClockIcon className="h-4 w-4" />}
            />
          </>
        ) : null}
      </div>

      <DailyTicketsChart data={stats?.dailyTickets ?? []} isPending={isPending} />
    </main>
  );
}
