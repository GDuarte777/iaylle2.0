import { useMemo, useState, useEffect } from "react";
import { useStatusConfig } from "@/store/statusConfig";
import { supabase } from "@/lib/supabase";

export function useAffiliateGamification(affiliateId: string | null) {
  const { classes, levels, achievements } = useStatusConfig();
  const [calendarStatuses, setCalendarStatuses] = useState<Record<string, string>>({});
  const [awardedAchievements, setAwardedAchievements] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!affiliateId) {
      setCalendarStatuses({});
      setAwardedAchievements({});
      return;
    }

    const fetchData = async () => {
      // 1. Fetch Metrics (Calendar Statuses)
      const { data: metrics } = await supabase
        .from('affiliate_metrics')
        .select('date, status')
        .eq('affiliate_id', affiliateId);
      
      const statusMap: Record<string, string> = {};
      metrics?.forEach((m: any) => {
        statusMap[`${affiliateId}:${m.date}`] = m.status;
      });
      setCalendarStatuses(statusMap);

      // 2. Fetch Achievements
      const { data: awards } = await supabase
        .from('affiliate_achievements')
        .select('achievement_id, period_tag')
        .eq('affiliate_id', affiliateId);
      
      const awardsMap: Record<string, boolean> = {};
      awards?.forEach((a: any) => {
        const key = a.period_tag ? `${a.achievement_id}@${a.period_tag}` : a.achievement_id;
        awardsMap[key] = true;
      });
      setAwardedAchievements(awardsMap);
    };

    fetchData();

    // Subscribe to changes for real-time updates
    const channel = supabase
      .channel('gamification_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'affiliate_metrics', filter: `affiliate_id=eq.${affiliateId}` },
        () => fetchData()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'affiliate_achievements', filter: `affiliate_id=eq.${affiliateId}` },
        () => fetchData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [affiliateId]);

  const result = useMemo(() => {
    if (!affiliateId) {
      return {
        totalXP: 0,
        currentLevel: null,
        nextLevel: null,
        progressPercent: 0,
        xpForNextLevel: 0,
        xpInCurrentLevel: 0,
      };
    }

    // 1. Calculate XP from Calendar Statuses
    let statusXP = 0;
    const prefix = `${affiliateId}:`;
    
    // Iterate over all calendar entries for this affiliate
    Object.entries(calendarStatuses).forEach(([key, statusKey]) => {
      if (key.startsWith(prefix)) {
        const statusClass = classes.find((c) => c.key === statusKey);
        if (statusClass) {
          statusXP += statusClass.points;
        }
      }
    });

    // 2. Calculate XP from Achievements
    let achievementXP = 0;
    
    // We iterate through configured achievements to see if they are awarded
    achievements.forEach((ach) => {
      // Check if this achievement is awarded (keys might be "achId" or "achId@YYYY-MM")
      Object.keys(awardedAchievements).forEach((awardedKey) => {
        // awardedKey could be "my_achievement" or "my_achievement@2023-10"
        if (awardedKey === ach.id || awardedKey.startsWith(`${ach.id}@`)) {
          achievementXP += ach.xp;
        }
      });
    });

    const totalXP = statusXP + achievementXP;

    // 3. Determine Level
    // Sort levels by minXP desc to find the highest matching one
    const sortedLevels = [...levels].sort((a, b) => b.minXP - a.minXP);
    const currentLevel = sortedLevels.find((l) => totalXP >= l.minXP) || sortedLevels[sortedLevels.length - 1] || null;
    
    // Find next level
    // Sort levels by minXP asc to find the first one > totalXP
    const sortedLevelsAsc = [...levels].sort((a, b) => a.minXP - b.minXP);
    const nextLevel = sortedLevelsAsc.find((l) => l.minXP > totalXP) || null;

    // 4. Calculate Progress
    let progressPercent = 0;
    let xpForNextLevel = 0;
    let xpInCurrentLevel = 0;

    if (currentLevel && nextLevel) {
      const xpGap = nextLevel.minXP - currentLevel.minXP;
      const xpProgress = totalXP - currentLevel.minXP;
      progressPercent = Math.min(100, Math.max(0, (xpProgress / xpGap) * 100));
      xpForNextLevel = nextLevel.minXP - totalXP;
      xpInCurrentLevel = xpProgress;
    } else if (currentLevel && !nextLevel) {
      // Max level reached
      progressPercent = 100;
      xpForNextLevel = 0;
      xpInCurrentLevel = totalXP - currentLevel.minXP;
    } else if (!currentLevel && nextLevel) {
      // No level yet (below first level?)
      const xpGap = nextLevel.minXP;
      progressPercent = Math.min(100, Math.max(0, (totalXP / xpGap) * 100));
      xpForNextLevel = nextLevel.minXP - totalXP;
      xpInCurrentLevel = totalXP;
    }

    return {
      totalXP,
      statusXP,
      achievementXP,
      currentLevel,
      nextLevel,
      progressPercent,
      xpForNextLevel,
      xpInCurrentLevel,
      calendarStatuses,
      awardedAchievements,
    };
  }, [affiliateId, classes, levels, achievements, calendarStatuses, awardedAchievements]);

  return result;
}
