import { createServerFn } from "@tanstack/react-start";

export type Stats = { online: boolean; voiceUsers: number; squadPlayers: number; activeSquads: number };
const OFFLINE: Stats = { online: false, voiceUsers: 0, squadPlayers: 0, activeSquads: 0 };

export async function fetchBotStats(): Promise<Stats> {
  const url = process.env['BOT_URL'];
  if (!url) return OFFLINE;
  try {
    const r = await fetch(url.replace(/\/$/, "") + "/stats", { signal: AbortSignal.timeout(5000) });
    return r.ok ? ((await r.json()) as Stats) : OFFLINE;
  } catch {
    return OFFLINE;
  }
}

export const getStats = createServerFn({ method: "GET" }).handler(() => fetchBotStats());
