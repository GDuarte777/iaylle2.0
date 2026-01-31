import type { Achievement } from "@/store/statusConfig";

export function calculateAchievementsForAffiliate(
  affiliateId: string,
  achievements: Achievement[],
  calendarStatuses: Record<string, string>
): Record<string, boolean> {
  const awarded: Record<string, boolean> = {};
  const prefix = `${affiliateId}:`;

  const affiliateEntries = Object.entries(calendarStatuses)
    .filter(([k]) => typeof k === "string" && k.startsWith(prefix))
    .map(([k, v]) => {
      const dateStr = String(k).split(":")[1] || "";
      const date = new Date(dateStr);
      return { dateStr, status: v, date };
    })
    .filter((e) => !Number.isNaN(e.date.getTime()))
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  if (affiliateEntries.length === 0) return awarded;

  for (const ach of achievements) {
    const validKeys = new Set(ach.classKeys);

    if ((ach.streakDays || 0) > 0) {
      const required = ach.streakDays as number;
      let run = 0;
      let maxRun = 0;
      let prev: Date | null = null;

      const validEntries = affiliateEntries.filter((e) => validKeys.has(e.status));

      for (const entry of validEntries) {
        if (prev) {
          const diff = (entry.date.getTime() - prev.getTime()) / (24 * 60 * 60 * 1000);
          run = diff === 1 ? run + 1 : 1;
        } else {
          run = 1;
        }
        prev = entry.date;
        if (run > maxRun) maxRun = run;
      }

      if (maxRun >= required) {
        awarded[ach.id] = true;
      }
      continue;
    }

    if ((ach.countThreshold || 0) > 0) {
      const required = ach.countThreshold as number;
      const timeWindow = ach.timeWindow || "total";

      if (timeWindow === "month") {
        const byMonth: Record<string, number> = {};
        for (const entry of affiliateEntries) {
          if (!validKeys.has(entry.status)) continue;
          const ym = entry.dateStr.slice(0, 7);
          if (!ym) continue;
          byMonth[ym] = (byMonth[ym] || 0) + 1;
        }

        for (const [ym, count] of Object.entries(byMonth)) {
          if (count >= required) {
            awarded[`${ach.id}@${ym}`] = true;
          }
        }
        continue;
      }

      if (timeWindow === "week") {
        const today = new Date();
        const day = today.getDay();
        const diffToMonday = (day + 6) % 7;
        const monday = new Date(today);
        monday.setHours(0, 0, 0, 0);
        monday.setDate(today.getDate() - diffToMonday);
        const sunday = new Date(monday);
        sunday.setHours(23, 59, 59, 999);
        sunday.setDate(monday.getDate() + 6);

        const count = affiliateEntries.filter((e) => validKeys.has(e.status) && e.date >= monday && e.date <= sunday).length;
        if (count >= required) {
          awarded[ach.id] = true;
        }
        continue;
      }

      const count = affiliateEntries.filter((e) => validKeys.has(e.status)).length;
      if (count >= required) {
        awarded[ach.id] = true;
      }
    }
  }

  return awarded;
}
