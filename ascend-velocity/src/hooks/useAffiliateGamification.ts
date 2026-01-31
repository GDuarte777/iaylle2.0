import { useMemo, useState, useEffect } from "react";
import type { Level } from "@/store/statusConfig";
import { useStatusConfig } from "@/store/statusConfig";
import { getAuthedUser, isSupabaseConfigured, supabase } from "@/lib/supabase";
import { calculateAchievementsForAffiliate } from "@/lib/gamificationUtils";

export type AffiliateGamificationResult = {
  totalXP: number;
  statusXP: number;
  achievementXP: number;
  currentLevel: Level | null;
  nextLevel: Level | null;
  progressPercent: number;
  xpForNextLevel: number;
  xpInCurrentLevel: number;
  calendarStatuses: Record<string, string>;
  awardedAchievements: Record<string, boolean>;
};

export function useAffiliateGamification(affiliateId: string | null): AffiliateGamificationResult {
  const { classes, levels, achievements } = useStatusConfig();
  const [calendarStatuses, setCalendarStatuses] = useState<Record<string, string>>({});
  const [dbAwardedAchievements, setDbAwardedAchievements] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!affiliateId) {
      setCalendarStatuses({});
      setDbAwardedAchievements({});
      return;
    }

    if (!isSupabaseConfigured) {
      setCalendarStatuses({});
      setDbAwardedAchievements({});
      return;
    }

    let cancelled = false;

    const fetchData = async () => {
      const user = await getAuthedUser();

      if (cancelled || !user) {
        setCalendarStatuses({});
        setDbAwardedAchievements({});
        return;
      }

      const { data: ownedAffiliate, error: ownedAffiliateError } = await supabase
        .from("affiliates")
        .select("id")
        .eq("id", affiliateId)
        .eq("owner_user_id", user.id)
        .maybeSingle();

      if (cancelled || ownedAffiliateError || !ownedAffiliate?.id) {
        setCalendarStatuses({});
        setDbAwardedAchievements({});
        return;
      }

      // 1. Fetch Metrics (Calendar Statuses)
      const { data: metrics } = await supabase
        .from('affiliate_metrics')
        .select('date, status')
        .eq('affiliate_id', affiliateId);
      
      const statusMap: Record<string, string> = {};
      metrics?.forEach((m: any) => {
        statusMap[`${affiliateId}:${m.date}`] = m.status;
      });
      if (!cancelled) setCalendarStatuses(statusMap);

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
      if (!cancelled) setDbAwardedAchievements(awardsMap);
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
      .subscribe((status) => {
        if (cancelled) return;
        if (status === 'SUBSCRIBED') {
          void fetchData();
        }
      });

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [affiliateId]);

  const result = useMemo<AffiliateGamificationResult>(() => {
    if (!affiliateId) {
      return {
        totalXP: 0,
        statusXP: 0,
        achievementXP: 0,
        currentLevel: null,
        nextLevel: null,
        progressPercent: 0,
        xpForNextLevel: 0,
        xpInCurrentLevel: 0,
        calendarStatuses: {},
        awardedAchievements: {},
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

    // 2. Calculate XP from Achievements (Dynamic + DB Merge)
    let achievementXP = 0;
    
    // Calculate dynamically based on current rules and calendar
    const calculatedAwards = calculateAchievementsForAffiliate(affiliateId, achievements, calendarStatuses);
    
    // Merge DB awards (for persistence/manual) with calculated (for live preview)
    // We prefer calculated for immediate feedback on rule changes
    const mergedAwards = { ...dbAwardedAchievements, ...calculatedAwards };

    // We iterate through configured achievements to see if they are awarded
    achievements.forEach((ach) => {
      // Check if this achievement is awarded (keys might be "achId" or "achId@YYYY-MM")
      Object.keys(mergedAwards).forEach((awardedKey) => {
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
      awardedAchievements: mergedAwards,
    };
  }, [affiliateId, classes, levels, achievements, calendarStatuses, dbAwardedAchievements]);

  return result;
}
