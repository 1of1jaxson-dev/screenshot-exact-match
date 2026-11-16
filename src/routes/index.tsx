import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getStats } from "@/lib/bot";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SIEGE BOT STATUS" },
      { name: "description", content: "Live status of the Siege Roblox Discord squad bot." },
      { property: "og:title", content: "SIEGE BOT STATUS" },
      { property: "og:description", content: "Live status of the Siege Roblox Discord squad bot." },
    ],
  }),
  component: Index,
});

function Index() {
  const { data } = useQuery({ queryKey: ["stats"], queryFn: () => getStats(), refetchInterval: 10000 });
  const rows = [
    [data?.online ? "🟢 Bot Online" : "🔴 Bot Offline", ""],
    ["👥 Total Users in Voice Channels", data?.voiceUsers],
    ["🎮 Players in Squad VCs", data?.squadPlayers],
    ["🛡️ Active Squads", data?.activeSquads],
  ];
  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center gap-6 p-6">
      <h1 className="text-4xl font-black tracking-widest">SIEGE BOT STATUS</h1>
      <div className="w-full max-w-md space-y-3">
        {rows.map(([label, v]) => (
          <div key={String(label)} className="flex justify-between rounded-lg border bg-card p-4 text-lg">
            <span>{label}</span><span className="font-bold">{data ? v : "…"}</span>
          </div>
        ))}
      </div>
    </main>
  );
}
