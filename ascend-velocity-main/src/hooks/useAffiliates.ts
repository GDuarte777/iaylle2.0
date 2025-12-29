import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export interface Affiliate {
  id: string;
  name: string;
  instagram: string;
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
}

export async function fetchAffiliates() {
  const { data, error } = await supabase
    .from('affiliates')
    .select('*')
    .eq('status', 'active')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching affiliates:', error);
    // Return empty array to avoid crashing UI
    return [];
  }
  return data || [];
}

export async function addAffiliate(name: string, instagram: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    toast.error("Usuário não autenticado");
    return null;
  }

  const { data, error } = await supabase
    .from('affiliates')
    .insert({
      owner_user_id: user.id,
      name,
      instagram,
      status: 'active'
    })
    .select()
    .single();

  if (error) {
    console.error('Error adding affiliate:', error);
    toast.error('Erro ao adicionar afiliada');
    return null;
  }
  return data;
}

export async function updateAffiliate(id: string, updates: Partial<Affiliate>) {
    const { error } = await supabase
        .from('affiliates')
        .update(updates)
        .eq('id', id);
    
    if (error) {
        console.error('Error updating affiliate:', error);
        toast.error('Erro ao atualizar afiliada');
        return false;
    }
    return true;
}

export async function deleteAffiliate(id: string) {
  // Fetch affiliate owner for potential fallbacks
  let ownerUserId: string | undefined;
  try {
    const { data: affRow } = await supabase
      .from('affiliates')
      .select('owner_user_id')
      .eq('id', id)
      .single();
    ownerUserId = (affRow as any)?.owner_user_id;
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
    .eq('id', id);
  if (error) {
    console.error('Error deleting affiliate:', error);
    toast.error('Erro ao remover afiliada');
    return false;
  }
  return true;
}

export async function fetchCalendarStatuses() {
  const { data, error } = await supabase
    .from('affiliate_metrics')
    .select('*');

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

  const { data, error } = await supabase
    .from('affiliate_metrics')
    .select('*')
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
  const startDate = new Date(year, month, 1).toISOString().split('T')[0];
  const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0];

  const { error: metErr } = await supabase
    .from('affiliate_metrics')
    .delete()
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
    .or(`period_tag.eq.${ym},period_tag.like.${ym}-%`);

  if (achErr) {
    console.error('Error deleting month achievements:', achErr);
    toast.error('Erro ao apagar conquistas do mês');
    return false;
  }

  return true;
}

export async function appendCalendarStatus(affiliateId: string, date: string, status: string | null) {
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
    const { error } = await supabase
      .from('affiliate_metrics')
      .upsert({ affiliate_id: affiliateId, date, status }, { onConflict: 'affiliate_id,date' });

    if (error) {
      console.error('Error saving status:', error);
      toast.error('Erro ao salvar status');
      return false;
    }
  }
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
      // Se for streak mensal, verifica se existe algum streak no mês em questão
      if (a.streakDays && a.streakDays > 0 && a.timeWindow === 'month') {
        // Filtra entries para apenas o mês de ym
        const monthEntries = entries.filter((d) => {
          const dYm = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
          return dYm === ym;
        });
        
        let run = 0;
        let prev: Date | null = null;
        meets = false;
        
        for (const d of monthEntries) {
          if (prev) {
            let diff = Math.round((d.getTime() - prev.getTime()) / (24 * 60 * 60 * 1000));
            if (a.ignoreDays && a.ignoreDays.length > 0) {
              const checkDate = new Date(prev);
              checkDate.setUTCDate(checkDate.getUTCDate() + 1);
              while (checkDate < d) {
                if (a.ignoreDays.includes(checkDate.getUTCDay())) {
                  diff--;
                }
                checkDate.setUTCDate(checkDate.getUTCDate() + 1);
              }
            }
            run = diff === 1 ? run + 1 : 1;
          } else {
            run = 1;
          }
          prev = d;
          if (run >= a.streakDays) {
            meets = true;
            break;
          }
        }
      } else if ((a.streakDays || 0) > 0) {
        let run = 0;
        let prev: Date | null = null;
        for (const d of entries) {
          if (prev) {
            let diff = Math.round((d.getTime() - prev.getTime()) / (24 * 60 * 60 * 1000));
            if (a.ignoreDays && a.ignoreDays.length > 0) {
              // Verifica dias intermediários ignorados
              const checkDate = new Date(prev);
              checkDate.setUTCDate(checkDate.getUTCDate() + 1);
              while (checkDate < d) {
                if (a.ignoreDays.includes(checkDate.getUTCDay())) {
                  diff--; // Subtrai dia ignorado da diferença
                }
                checkDate.setUTCDate(checkDate.getUTCDate() + 1);
              }
            }
            // Se diff é 1, é consecutivo. Se diff < 1 (caso de mesma data, não deve ocorrer aqui pois entries é único), mantém.
            // Se diff > 1, quebrou a sequência.
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
      } else if ((a.countThreshold || 0) > 0) {
        if (a.timeWindow === 'month') {
          const count = entries.filter((d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` === ym).length;
          meets = count >= (a.countThreshold || 0);
        } else if (a.timeWindow === 'total') {
          meets = entries.length >= (a.countThreshold || 0);
        } else {
          const today = new Date(date);
          const day = today.getDay();
          const diffToMonday = (day + 6) % 7;
          const monday = new Date(today);
          monday.setDate(today.getDate() - diffToMonday);
          const sunday = new Date(monday);
          sunday.setDate(monday.getDate() + 6);
          const count = entries.filter((d) => d >= monday && d <= sunday).length;
          meets = count >= (a.countThreshold || 0);
          periodTag = `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, '0')}-${String(monday.getDate()).padStart(2, '0')}`;
        }
      }
      if (a.timeWindow === 'month') periodTag = ym;
      if (a.timeWindow === 'total') periodTag = null;
      const key = periodTag ? `${a.id}@${periodTag}` : a.id;
      if (meets && !awardedKeyMap[key]) {
        addAwards.push({ achievement_id: a.id, period_tag: periodTag, points_awarded: a.xp });
      } else if (!meets && awardedKeyMap[key]) {
        removeAwards.push(awardedKeyMap[key]);
      }
    });
    if (addAwards.length) {
      const insertRows = addAwards.map((aw) => ({ affiliate_id: affiliateId, achievement_id: aw.achievement_id, period_tag: aw.period_tag, points_awarded: aw.points_awarded, awarded_at: new Date().toISOString() }));
      const { error: awardErr } = await supabase.from('affiliate_achievements').insert(insertRows);
      if (!awardErr) {
        window.dispatchEvent(new CustomEvent('achievement-awarded'));
      }
    }
    if (removeAwards.length) {
      const { error: removeErr } = await supabase.from('affiliate_achievements').delete().in('id', removeAwards);
      if (!removeErr) {
        window.dispatchEvent(new CustomEvent('achievement-awarded'));
      }
    }
  } catch (error) {
    void error;
  }
  // Sempre notifica o front para atualizar pontos imediatamente
  try {
    window.dispatchEvent(new CustomEvent('calendar-status-updated', { detail: { affiliateId, date, status } }));
  } catch (error) {
    void error;
  }
  return true;
}

export async function fetchAwardedAchievements() {
  const { data, error } = await supabase
    .from('affiliate_achievements')
    .select('*');
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
