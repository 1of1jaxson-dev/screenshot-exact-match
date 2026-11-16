import { createFileRoute } from "@tanstack/react-router";
import { fetchBotStats } from "@/lib/bot";

export const Route = createFileRoute("/api/public/health")({
  server: {
    handlers: {
      GET: async () => {
        const s = await fetchBotStats();
        return Response.json({ online: s.online }, { status: s.online ? 200 : 503 });
      },
    },
  },
});
