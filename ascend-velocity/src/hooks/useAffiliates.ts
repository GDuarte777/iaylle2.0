import { getAuthedUser, supabase, userCanWrite } from '@/lib/supabase';
import { toast } from 'sonner';

export interface Affiliate {
  id: string;
  name: string;
  instagram?: string | null;
  instagram_link?: string;
  notes?: string;
  status: string;
  created_at?: string;
}

// Computed interface for Dashboard display
export interface AffiliateWithMetrics extends Affiliate {
  points: number;
  level: string;
  performance: number;
  posted: number;
  notPosted: number;
  noAnalysis: number;
  salesPosts: number;
  myAchievements?: any[];
}

const DEFAULT_EXAMPLE_AFFILIATE_NAMES = new Set([
  "Afiliada Exemplo 1",
  "Afiliada Exemplo 2",
  "Afiliada Exemplo 3",
]);

function withAbortSignal<T>(query: T, signal?: AbortSignal): T {
  if (!signal) return query;
  const anyQuery = query as any;
  if (anyQuery && typeof anyQuery.abortSignal === "function") {
    return anyQuery.abortSignal(signal) as T;
  }
  return query;
}

function dedupeDefaultExampleAffiliates(rows: any[]) {
  const selectedByName = new Map<string, any>();

  for (const row of rows || []) {
    const name = row?.name;
    if (!DEFAULT_EXAMPLE_AFFILIATE_NAMES.has(name)) continue;

    const prev = selectedByName.get(name);
    if (!prev) {
      selectedByName.set(name, row);
      continue;
    }

    const prevTs = prev?.created_at ? Date.parse(prev.created_at) : Number.POSITIVE_INFINITY;
    const curTs = row?.created_at ? Date.parse(row.created_at) : Number.POSITIVE_INFINITY;

    if (Number.isFinite(curTs) && (curTs < prevTs || !Number.isFinite(prevTs))) {
      selectedByName.set(name, row);
    }
  }

  const keepIds = new Set(Array.from(selectedByName.values()).map((r) => r?.id).filter(Boolean));

  return (rows || []).filter((row) => {
    const name = row?.name;
    if (!DEFAULT_EXAMPLE_AFFILIATE_NAMES.has(name)) return true;
    return keepIds.has(row?.id);
  });
}

async function enforceFreeWriteAccess(signal?: AbortSignal) {
  try {
    const user = await getAuthedUser();

    if (!user) {
      toast.error("Usuário não autenticado");
      return false;
    }

    const canWrite = await userCanWrite(user.id);
    if (!canWrite) {
      toast.error("Esta funcionalidade não está disponível no seu plano atual.");
      return false;
    }

    const subQuery = supabase
      .from("subscriptions")
      .select("id")
      .eq("user_id", user.id)
      .in("status", ["active", "trialing", "past_due"])
      .limit(1)
      .maybeSingle();
    const { data: sub } = await withAbortSignal(subQuery, signal);

    if (sub?.id) return true;

    const settingsQuery = supabase
      .from("app_settings")
      .select("value")
      .eq("key", "billing_settings")
      .maybeSingle();
    const { data: settings } = await withAbortSignal(settingsQuery, signal);

    const value = (settings as any)?.value as { free_usage_limit?: number } | undefined;
    const freeUsageLimit = typeof value?.free_usage_limit === "number" ? value.free_usage_limit : null;

    if (typeof freeUsageLimit !== "number") return true;

    const limit = Math.max(0, freeUsageLimit);
    if (limit <= 0) return true;

    const countQuery = supabase
      .from("affiliates")
      .select("id", { count: "exact", head: true })
      .eq("owner_user_id", user.id)
      .eq("status", "active");
    const { count } = await withAbortSignal(countQuery, signal);

    const currentCount = typeof count === "number" ? count : 0;

    if (currentCount >= limit) {
      toast.error("Limite do plano Free atingido. Faça upgrade para continuar.");
      try {
        window.location.href = "/dashboard/settings";
      } catch (error) {
        void error;
      }
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

async function getOwnedAffiliateIds() {
  const user = await getAuthedUser();

  if (!user) {
    return { userId: null as string | null, affiliateIds: [] as string[] };
  }

  const { data: affiliates, error } = await supabase
    .from("affiliates")
    .select("id")
    .eq("owner_user_id", user.id);

  if (error) {
    return { userId: user.id, affiliateIds: [] as string[] };
  }

  const affiliateIds = (affiliates || []).map((a: any) => a.id).filter(Boolean);
  return { userId: user.id, affiliateIds };
}

export async function fetchAffiliates() {
  const user = await getAuthedUser();

  if (!user) return [];

  const { data, error } = await supabase
    .from('affiliates')
    .select('*')
    .eq('owner_user_id', user.id)
    .eq('status', 'active')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching affiliates:', error);
    // Return empty array to avoid crashing UI
    return [];
  }

  if (!data || data.length === 0) {
    const { error: ensureError } = await supabase.rpc('ensure_default_affiliates');
    if (ensureError) {
      return [];
    }

    const { data: newData, error: refetchError } = await supabase
      .from('affiliates')
      .select('*')
      .eq('owner_user_id', user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (refetchError) {
      return [];
    }

    return dedupeDefaultExampleAffiliates(newData || []);
  }

  return dedupeDefaultExampleAffiliates(data || []);
}

export async function addAffiliate(
  name: string,
  instagram?: string | null,
  instagram_link?: string,
  notes?: string,
  options?: { signal?: AbortSignal },
) {
  const allowed = await enforceFreeWriteAccess(options?.signal);
  if (!allowed) return null;

  const user = await getAuthedUser();
  if (!user) {
    toast.error("Usuário não autenticado");
    return null;
  }

  const ig = typeof instagram === 'string' ? instagram.trim() : '';

  const insertQuery = supabase
    .from('affiliates')
    .insert({
      owner_user_id: user.id,
      name,
      instagram: ig ? ig : null,
      instagram_link,
      notes,
      status: 'active'
    })
    .select()
    .single();

  const { data, error } = await withAbortSignal(insertQuery, options?.signal);

  if (error) {
    console.error('Error adding affiliate:', error);
    toast.error('Erro ao adicionar afiliada');
    return null;
  }
  return data;
}

export async function updateAffiliate(id: string, updates: Partial<Affiliate>) {
    const allowed = await enforceFreeWriteAccess();
    if (!allowed) return false;

    const user = await getAuthedUser();

    if (!user) {
      toast.error("Usuário não autenticado");
      return false;
    }

    const { error } = await supabase
        .from('affiliates')
        .update(updates)
        .eq('id', id)
        .eq('owner_user_id', user.id);
    
    if (error) {
        console.error('Error updating affiliate:', error);
        toast.error('Erro ao atualizar afiliada');
        return false;
    }
    return true;
}

export async function deleteAffiliate(id: string) {
  const allowed = await enforceFreeWriteAccess();
  if (!allowed) return false;

  const user = await getAuthedUser();

  if (!user) {
    toast.error("Usuário não autenticado");
    return false;
  }

  const { data: affiliateRow, error: affiliateError } = await supabase
    .from('affiliates')
    .select('id, owner_user_id')
    .eq('id', id)
    .eq('owner_user_id', user.id)
    .maybeSingle();

  if (affiliateError || !affiliateRow?.id) {
    toast.error("Afiliada não encontrada");
    return false;
  }

  // Fetch affiliate owner for potential fallbacks
  let ownerUserId: string | undefined;
  try {
    ownerUserId = (affiliateRow as any)?.owner_user_id;
  } catch (error) {
    void error;
  }

  // Remove registros relacionados antes, garantindo consistência referencial
  // affiliate_achievements
  const { error: achErr } = await supabase
    .from('affiliate_achievements')
    .delete()
    .eq('affiliate_id', id);
  if (achErr) {
    if ((achErr as any).code === 'PGRST205') {
      // Tabela não existe; tenta fallback conhecido
      try {
        if (ownerUserId) {
          const { error: userAchErr } = await supabase
            .from('user_achievements')
            .delete()
            .eq('user_id', ownerUserId);
          if (userAchErr) {
            console.warn('Fallback user_achievements failed:', userAchErr);
          }
        }
      } catch (error) {
        void error;
      }
    } else {
      console.error('Error deleting related achievements:', achErr);
      toast.error('Erro ao remover conquistas relacionadas');
      return false;
    }
  }

  // affiliate_metrics
  const { error: metErr } = await supabase
    .from('affiliate_metrics')
    .delete()
    .eq('affiliate_id', id);
  if (metErr) {
    if ((metErr as any).code === 'PGRST205') {
      // Fallback para calendar_events se existir
      const { error: evErr } = await supabase
        .from('calendar_events')
        .delete()
        .eq('affiliate_id', id);
      if (evErr) {
        console.error('Error deleting related metrics (fallback):', evErr);
        toast.error('Erro ao remover métricas relacionadas');
        return false;
      }
    } else {
      console.error('Error deleting related metrics:', metErr);
      toast.error('Erro ao remover métricas relacionadas');
      return false;
    }
  }

  // Finalmente, remove a afiliada
  const { error } = await supabase
    .from('affiliates')
    .delete()
    .eq('id', id)
    .eq('owner_user_id', user.id);
  if (error) {
    console.error('Error deleting affiliate:', error);
    toast.error('Erro ao remover afiliada');
    return false;
  }
  return true;
}

export async function fetchCalendarStatuses() {
  const { userId, affiliateIds } = await getOwnedAffiliateIds();
  if (!userId) return {};
  if (!affiliateIds.length) return {};

  const { data, error } = await supabase
    .from('affiliate_metrics')
    .select('affiliate_id, date, status')
    .in('affiliate_id', affiliateIds);

  if (error) {
    console.error('Error fetching statuses:', error);
    return {};
  }

  const map: Record<string, string> = {};
  data?.forEach((event: any) => {
    map[`${event.affiliate_id}:${event.date}`] = event.status;
  });
  return map;
}

export async function fetchCalendarStatusesForMonth(year: number, month: number) {
  // month is 0-indexed in JS (0 = Jan), so we need to handle that carefully
  // We want all events for the given year and month
  // Construct start and end dates
  const startDate = new Date(year, month, 1).toISOString().split('T')[0];
  const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0];

  const { userId, affiliateIds } = await getOwnedAffiliateIds();
  if (!userId) return {};
  if (!affiliateIds.length) return {};

  const { data, error } = await supabase
    .from('affiliate_metrics')
    .select('affiliate_id, date, status')
    .in('affiliate_id', affiliateIds)
    .gte('date', startDate)
    .lte('date', endDate);

  if (error) {
    console.error('Error fetching month statuses:', error);
    return {};
  }

  const map: Record<string, string> = {};
  data?.forEach((event: any) => {
    map[`${event.affiliate_id}:${event.date}`] = event.status;
  });
  return map;
}

export async function deleteMonthData(year: number, month: number) {
  const allowed = await enforceFreeWriteAccess();
  if (!allowed) return false;

  const startDate = new Date(year, month, 1).toISOString().split('T')[0];
  const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0];

  const { userId, affiliateIds } = await getOwnedAffiliateIds();
  if (!userId) {
    toast.error("Usuário não autenticado");
    return false;
  }
  if (!affiliateIds.length) return true;

  const { error: metErr } = await supabase
    .from('affiliate_metrics')
    .delete()
    .in('affiliate_id', affiliateIds)
    .gte('date', startDate)
    .lte('date', endDate);

  if (metErr) {
    console.error('Error deleting month metrics:', metErr);
    toast.error('Erro ao apagar dados do mês');
    return false;
  }

  const ym = `${year}-${String(month + 1).padStart(2, '0')}`;

  const { error: achErr } = await supabase
    .from('affiliate_achievements')
    .delete()
    .in('affiliate_id', affiliateIds)
    .or(`period_tag.eq.${ym},period_tag.like.${ym}-%`);

  if (achErr) {
    console.error('Error deleting month achievements:', achErr);
    toast.error('Erro ao apagar conquistas do mês');
    return false;
  }

  return true;
}

export async function appendCalendarStatus(affiliateId: string, date: string, status: string | null) {
  const user = await getAuthedUser();

  if (!user) {
    toast.error("Usuário não autenticado");
    return false;
  }

  const { data: ownedAffiliate, error: ownedAffiliateError } = await supabase
    .from('affiliates')
    .select('id')
    .eq('id', affiliateId)
    .eq('owner_user_id', user.id)
    .maybeSingle();

  if (ownedAffiliateError || !ownedAffiliate?.id) {
    toast.error("Afiliada não encontrada");
    return false;
  }

  if (status === null) {
    const { error } = await supabase
      .from('affiliate_metrics')
      .delete()
      .eq('affiliate_id', affiliateId)
      .eq('date', date);
    if (error) {
      console.error('Error clearing status:', error);
      toast.error('Erro ao limpar status');
      return false;
    }
    // Continua para reavaliar conquistas e remover pontos se necessário
  } else {
    let points = 0;
    try {
      const cfg = (await import('@/store/statusConfig')).useStatusConfig.getState();
      const match = (cfg as any)?.classes?.find((c: any) => c?.key === status);
      const rawPoints = (match as any)?.points;
      points = typeof rawPoints === 'number' && Number.isFinite(rawPoints) ? rawPoints : 0;
    } catch {
      points = 0;
    }

    const { error } = await supabase
      .from('affiliate_metrics')
      .upsert({ affiliate_id: affiliateId, date, status, points }, { onConflict: 'affiliate_id,date' });

    if (error) {
      console.error('Error saving status:', error);
      toast.error('Erro ao salvar status');
      return false;
    }
  }

  try {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('calendar-status-updated'));
    }
  } catch {
    void 0;
  }

  // Executa avaliação de conquistas em background para não bloquear a UI
  void (async () => {
    try {
      const cfg = (await import('@/store/statusConfig')).useStatusConfig.getState();
      const ym = date.slice(0, 7);
      const { data: rows } = await supabase
        .from('affiliate_metrics')
        .select('*')
        .eq('affiliate_id', affiliateId);
      
      const validMap: Record<string, string> = {};
      (rows || []).forEach((e: any) => { validMap[`${affiliateId}:${e.date}`] = e.status; });
      
      const awardedKeyMap: Record<string, string> = {};
      const { data: awardedRows } = await supabase
        .from('affiliate_achievements')
        .select('id, achievement_id, period_tag')
        .eq('affiliate_id', affiliateId);
        
      (awardedRows || []).forEach((r: any) => {
        const key = r.period_tag ? `${r.achievement_id}@${r.period_tag}` : r.achievement_id;
        awardedKeyMap[key] = r.id;
      });

      const addAwards: { achievement_id: string; period_tag: string | null; points_awarded: number }[] = [];
      const removeAwards: string[] = [];

      cfg.achievements.forEach((a) => {
        const valid = new Set(a.classKeys || []);
        const entries = Object.entries(validMap)
          .filter(([k, v]) => k.startsWith(`${affiliateId}:`) && valid.has(v))
          .map(([k]) => new Date(k.split(':')[1]))
          .sort((d1, d2) => d1.getTime() - d2.getTime());

        let meets = false;
        let periodTag: string | null = null;

        // Lógica para Streak
        if ((a.streakDays || 0) > 0) {
          let entriesToCheck = entries;
          
          if (a.timeWindow === 'month') {
            entriesToCheck = entries.filter((d) => {
              const dYm = d.toISOString().slice(0, 7);
              return dYm === ym;
            });
            periodTag = ym;
          } else if (a.timeWindow === 'week') {
             try {
               const dObj = new Date(date);
               const day = dObj.getUTCDay();
               const diffToMonday = (day + 6) % 7;
               const monday = new Date(dObj);
               monday.setUTCDate(dObj.getUTCDate() - diffToMonday);
               const sunday = new Date(monday);
               sunday.setUTCDate(monday.getUTCDate() + 6);
               
               const mStr = monday.toISOString().slice(0, 10);
               const sStr = sunday.toISOString().slice(0, 10);
               
               entriesToCheck = entries.filter(d => {
                 const dStr = d.toISOString().slice(0, 10);
                 return dStr >= mStr && dStr <= sStr;
               });
               periodTag = `${mStr}`;
             } catch (e) {
               console.error("Error calculating week dates:", e);
               entriesToCheck = [];
             }
          } else {
            periodTag = null;
          }

          let run = 0;
          let prev: Date | null = null;
          meets = false;

          for (const d of entriesToCheck) {
            if (prev) {
              let diff = Math.round((d.getTime() - prev.getTime()) / (24 * 60 * 60 * 1000));
              
              if (a.ignoreDays && a.ignoreDays.length > 0) {
                const checkDate = new Date(prev);
                checkDate.setUTCDate(checkDate.getUTCDate() + 1);
                // Previne loop infinito limitando a verificação a 30 dias (segurança)
                let safety = 0;
                while (checkDate < d && safety < 30) {
                  if (a.ignoreDays.includes(checkDate.getUTCDay())) {
                    diff--;
                  }
                  checkDate.setUTCDate(checkDate.getUTCDate() + 1);
                  safety++;
                }
              }
              
              run = diff === 1 ? run + 1 : 1;
            } else {
              run = 1;
            }
            prev = d;
            if (run >= (a.streakDays || 0)) {
              meets = true;
              break;
            }
          }
        } 
        // Lógica para Contagem
        else if ((a.countThreshold || 0) > 0) {
          if (a.timeWindow === 'month') {
            const count = entries.filter((d) => d.toISOString().slice(0, 7) === ym).length;
            meets = count >= (a.countThreshold || 0);
            periodTag = ym;
          } else if (a.timeWindow === 'week') {
             try {
               const dObj = new Date(date);
               const day = dObj.getUTCDay();
               const diffToMonday = (day + 6) % 7;
               const monday = new Date(dObj);
               monday.setUTCDate(dObj.getUTCDate() - diffToMonday);
               const sunday = new Date(monday);
               sunday.setUTCDate(monday.getUTCDate() + 6);
               
               const mStr = monday.toISOString().slice(0, 10);
               const sStr = sunday.toISOString().slice(0, 10);
               
               const count = entries.filter(d => {
                 const dStr = d.toISOString().slice(0, 10);
                 return dStr >= mStr && dStr <= sStr;
               }).length;
               
               meets = count >= (a.countThreshold || 0);
               periodTag = `${mStr}`;
             } catch (e) {
               console.error("Error calculating week count:", e);
               meets = false;
             }
          } else {
            meets = entries.length >= (a.countThreshold || 0);
            periodTag = null;
          }
        }

        const key = periodTag ? `${a.id}@${periodTag}` : a.id;
        
        if (meets && !awardedKeyMap[key]) {
          addAwards.push({ achievement_id: a.id, period_tag: periodTag, points_awarded: a.xp });
        } else if (!meets && awardedKeyMap[key]) {
          removeAwards.push(awardedKeyMap[key]);
        }
      });

      if (addAwards.length) {
        const insertRows = addAwards.map((aw) => ({ 
          affiliate_id: affiliateId, 
          achievement_id: aw.achievement_id, 
          period_tag: aw.period_tag, 
          points_awarded: aw.points_awarded, 
          awarded_at: new Date().toISOString() 
        }));
        const { error: awardErr } = await supabase.from('affiliate_achievements').insert(insertRows);
        if (!awardErr) {
          window.dispatchEvent(new CustomEvent('achievement-awarded'));
        }
      }

      if (removeAwards.length) {
        const { error: removeErr } = await supabase.from('affiliate_achievements').delete().in('id', removeAwards);
        if (removeErr) {
          console.error('Error removing achievements:', removeErr);
        } else {
          window.dispatchEvent(new CustomEvent('achievement-awarded'));
        }
      }
    } catch (error) {
      console.error('Error evaluating achievements:', error);
    }
  })();

  // Sempre notifica o front para atualizar pontos imediatamente
  try {
    window.dispatchEvent(new CustomEvent('calendar-status-updated', { detail: { affiliateId, date, status } }));
  } catch (error) {
    void error;
  }
  return true;
}

export async function fetchAwardedAchievements() {
  const { userId, affiliateIds } = await getOwnedAffiliateIds();
  if (!userId) return {} as Record<string, Record<string, boolean>>;
  if (!affiliateIds.length) return {} as Record<string, Record<string, boolean>>;

  const { data, error } = await supabase
    .from('affiliate_achievements')
    .select('affiliate_id, achievement_id, period_tag')
    .in('affiliate_id', affiliateIds);
  if (error) {
    return {} as Record<string, Record<string, boolean>>;
  }
  const map: Record<string, Record<string, boolean>> = {};
  (data || []).forEach((r: any) => {
    const key = r.period_tag ? `${r.achievement_id}@${r.period_tag}` : r.achievement_id;
    if (!map[r.affiliate_id]) map[r.affiliate_id] = {};
    map[r.affiliate_id][key] = true;
  });
  return map;
}
