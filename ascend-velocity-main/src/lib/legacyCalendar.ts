import { useStatusConfig } from "@/store/statusConfig";
import { appendCalendarStatus, fetchCalendarStatusesForMonth } from "@/hooks/useAffiliates";

declare global {
  interface Window {
    elementSdk?: { config?: any };
    openLegacyCalendar?: (affiliate: any) => void;
    toggleDayMenu?: (day: number) => void;
    marcarDia?: (day: number, status: string | null) => void;
    getStatusForDay?: (id: string | number, day: number, month: number, year: number) => string | null;
    navegarMes?: (direction: "prev" | "next") => void;
    fecharCalendario?: () => void;
    __calendarStatuses?: Record<string, string>;
    selectedAfiliada?: any;
    currentMonth?: number;
    currentYear?: number;
    defaultConfig?: any;
    renderCalendario?: () => string;
    themeObserver?: MutationObserver | null;
    __affiliatePoints?: Record<string, number>;
    __awardedAchievements?: Record<string, Record<string, boolean>>;
    onAchievementAwarded?: (event: { affiliateId: string; achievementId: string; xp: number; title: string }) => void;
    __loadedMonths?: Record<string, boolean>;
  }
}

window.__calendarStatuses = window.__calendarStatuses || {};
window.__affiliatePoints = window.__affiliatePoints || {};
window.__awardedAchievements = window.__awardedAchievements || {};
window.__loadedMonths = window.__loadedMonths || {};
window.selectedAfiliada = null;
window.currentMonth = new Date().getMonth();
window.currentYear = new Date().getFullYear();
window.defaultConfig = {
  background_color: "#f8fafc",
  card_color: "#ffffff",
  text_color: "#1e293b",
  primary_color: "#9b184e",
  accent_color: "#e75761",
  font_family: "Inter",
  font_size: 12,
  titulo_principal: "Painel de Gestão de Afiliadas - Aylle Duarte",
  subtitulo: "Acompanhe o desempenho dos seus afiliados em tempo real",
  empresa: "Aylle Duarte",
};

function ensureStyles() {
  const id = "legacy-calendar-styles";
  if (document.getElementById(id)) return;
  const style = document.createElement("style");
  style.id = id;
  style.textContent = `
    #legacy-calendar-overlay {
      --calendar-bg: rgba(255, 255, 255, 0.75);
      --calendar-text: #1e293b;
      --calendar-primary: #9b184e;
      --calendar-day-bg: #f1f5f9;
      --calendar-day-text: #475569;
      --calendar-menu-bg: #ffffff;
      --calendar-menu-hover: #f8fafc;
      --calendar-border: #e2e8f0;
      --calendar-shadow: rgba(155, 24, 78, 0.1);
      --modal-backdrop-bg: rgba(0, 0, 0, 0.4);
    }

    #legacy-calendar-overlay.dark {
      --calendar-bg: rgba(30, 41, 59, 0.75);
      --calendar-text: #f8fafc;
      --calendar-primary: #e75761;
      --calendar-day-bg: #334155;
      --calendar-day-text: #cbd5e1;
      --calendar-menu-bg: #1e293b;
      --calendar-menu-hover: #334155;
      --calendar-border: #334155;
      --calendar-shadow: rgba(231, 87, 97, 0.15);
      --modal-backdrop-bg: rgba(0, 0, 0, 0.6);
    }

    .gradient-bg { background: linear-gradient(135deg, #9b184e 0%, #e75761 100%); }
    .glass-effect {
      backdrop-filter: blur(12px);
      background: var(--calendar-bg);
      color: var(--calendar-text);
      border: 1px solid var(--calendar-border);
    }
    html.dark .glass-effect {
      background: rgba(30, 41, 59, 0.80);
      color: #f8fafc;
      border-color: #334155;
    }
    .card-shadow { box-shadow: 0 4px 20px var(--calendar-shadow); }
    .hover-lift { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
    .hover-lift:hover { transform: translateY(-4px); box-shadow: 0 8px 30px rgba(155, 24, 78, 0.2); }
    .calendar-day { transition: all 0.2s ease; cursor: pointer; position: relative; }
    .calendar-day:hover { transform: scale(1.05); }
    .status-postou-vendas { background: linear-gradient(135deg, #059669, #10B981); color: white; }
    .status-postou { background: linear-gradient(135deg, #F59E0B, #FCD34D); color: white; }
    .status-nao-postou { background: linear-gradient(135deg, #EF4444, #F87171); color: white; }
    .status-sem-analise { background: linear-gradient(135deg, #6B7280, #9CA3AF); color: white; }
    .modal-backdrop { backdrop-filter: blur(8px); background: var(--modal-backdrop-bg); }
    .day-default-bg { background-color: var(--calendar-day-bg); color: var(--calendar-day-text); }
    .day-menu { background-color: var(--calendar-menu-bg); border-color: var(--calendar-border); }
    .day-menu-btn:hover { background-color: var(--calendar-menu-hover); }
    .close-btn:hover { background-color: var(--calendar-day-bg); }

    @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
    .animate-fade-in { animation: fadeInUp 0.6s ease-out; }
  `;
  document.head.appendChild(style);
}

function getDaysInMonth(month: number, year: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(month: number, year: number) {
  return new Date(year, month, 1).getDay();
}

function evaluateAchievementsFor(affiliateId: string) {
  const st = useStatusConfig.getState();
  const achs = st.achievements || [];
  const awarded = window.__awardedAchievements![affiliateId] || {};
  const entries = Object.entries(window.__calendarStatuses!)
    .filter(([k, v]) => k.startsWith(`${affiliateId}:`));
  for (const a of achs) {
    const ym = `${window.currentYear}-${String(window.currentMonth! + 1).padStart(2, "0")}`;
    const awardKey = a.timeWindow === "month" ? `${a.id}@${ym}` : a.id;
    if (awarded[awardKey]) continue;
    const valid = new Set(a.classKeys || []);
    const dates = entries
      .filter(([, v]) => valid.has(v))
      .map(([k]) => new Date(k.split(":")[1]))
      .sort((d1, d2) => d1.getTime() - d2.getTime());
    if ((a.streakDays || 0) > 0) {
      let run = 0;
      let prev: Date | null = null;
      for (const d of dates) {
        if (prev) {
          const diff = (d.getTime() - prev.getTime()) / (24 * 60 * 60 * 1000);
          if (diff === 1) run += 1; else run = 1;
        } else {
          run = 1;
        }
        prev = d;
        if (run >= (a.streakDays || 0)) {
          window.__awardedAchievements![affiliateId] = { ...awarded, [awardKey]: true };
          window.__affiliatePoints![affiliateId] = (window.__affiliatePoints![affiliateId] || 0) + a.xp;
          window.onAchievementAwarded?.({ affiliateId, achievementId: a.id, xp: a.xp, title: a.title });
          break;
        }
      }
    }
    if ((a.countThreshold || 0) > 0) {
      const inMonth = entries
        .filter(([k, v]) => k.includes(`:${ym}-`))
        .filter(([, v]) => valid.has(v));
      if (inMonth.length >= (a.countThreshold || 0)) {
        window.__awardedAchievements![affiliateId] = { ...awarded, [awardKey]: true };
        window.__affiliatePoints![affiliateId] = (window.__affiliatePoints![affiliateId] || 0) + a.xp;
        window.onAchievementAwarded?.({ affiliateId, achievementId: a.id, xp: a.xp, title: a.title });
      }
    }
  }
}

window.getStatusForDay = function (id, day, month, year) {
  const key = `${id}:${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  return window.__calendarStatuses![key] || null;
};

window.marcarDia = function (day, status) {
  if (!window.selectedAfiliada) return;
  const key = `${window.selectedAfiliada.id}:${window.currentYear}-${String(window.currentMonth! + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  if (status) window.__calendarStatuses![key] = status; else delete window.__calendarStatuses![key];
  const dateISO = `${window.currentYear}-${String(window.currentMonth! + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  
  // Calculate points change
  const classes = useStatusConfig.getState().classes;
  const currentPoints = window.__affiliatePoints![window.selectedAfiliada.id] || 0;
  
  // Find points for the new status
  const newClass = classes.find(c => c.key === status);
  const newPoints = newClass?.points || 0;
  
  // Find points for the old status (if any)
  // We need to check what was there before update. Since we already updated __calendarStatuses above,
  // we rely on the fact that we're adding/removing points relative to the change.
  // Actually, a safer way is to recalculate total points for the month or just add the delta.
  // Let's use delta logic:
  // If we are setting a status, we add its points.
  // If there was a previous status, we should subtract its points?
  // The current logic in Dashboard recalculates everything from scratch on refresh.
  // To make it instant here, we can trigger a custom event that Dashboard listens to.
  
  appendCalendarStatus(window.selectedAfiliada.id, dateISO, status).then(() => {
    // Dispatch event to refresh dashboard data
    window.dispatchEvent(new Event('focus'));
  });

  evaluateAchievementsFor(window.selectedAfiliada.id);
  const root = document.getElementById("legacy-calendar-root");
  if (root) root.innerHTML = window.renderCalendario!();
};

window.toggleDayMenu = function (day) {
  const menu = document.getElementById(`day-menu-${day}`);
  if (!menu) return;
  const isHidden = menu.classList.contains("hidden");
  document.querySelectorAll('[id^="day-menu-"]').forEach(el => el.classList.add("hidden"));
  if (isHidden) menu.classList.remove("hidden");
};

window.navegarMes = function (direction) {
  const delta = direction === "prev" ? -1 : 1;
  const d = new Date(window.currentYear!, window.currentMonth! + delta, 1);
  window.currentYear = d.getFullYear();
  window.currentMonth = d.getMonth();
  ensureMonthLoaded(window.currentYear!, window.currentMonth!);
  const root = document.getElementById("legacy-calendar-root");
  if (root) root.innerHTML = window.renderCalendario!();
};

window.fecharCalendario = function () {
  const overlay = document.getElementById("legacy-calendar-overlay");
  if (overlay) overlay.remove();
  if (window.themeObserver) {
    window.themeObserver.disconnect();
    window.themeObserver = null;
  }
};

window.renderCalendario = function () {
  if (!window.selectedAfiliada) return "";
  ensureMonthLoaded(window.currentYear!, window.currentMonth!);
  const config = window.elementSdk?.config || window.defaultConfig;
  const baseSize = config.font_size || window.defaultConfig.font_size;
  const daysInMonth = getDaysInMonth(window.currentMonth!, window.currentYear!);
  const firstDay = getFirstDayOfMonth(window.currentMonth!, window.currentYear!);
  const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
  const dayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  const statusClasses = useStatusConfig.getState().classes;
  let calendarHTML = `
    <div class="fixed inset-0 modal-backdrop flex items-center justify-center z-50">
      <div class="max-w-xs w-full mx-4 glass-effect rounded-2xl p-3 card-shadow animate-fade-in" onclick="event.stopPropagation()">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h3 style="font-size: ${baseSize * 1.5}px; font-weight: 700; color: var(--calendar-primary);">📅 ${window.selectedAfiliada.nome}</h3>
            <p style="font-size: ${baseSize * 0.9}px; opacity: 0.7;">Marque as postagens do mês</p>
          </div>
          <button onclick="fecharCalendario()" class="p-3 rounded-xl close-btn transition-all" style="font-size: ${baseSize * 1.2}px;">✕</button>
        </div>
        <div class="flex items-center justify-between mb-4">
          <button onclick="navegarMes('prev')" class="p-3 rounded-xl gradient-bg text-white hover-lift">‹</button>
          <h4 style="font-size: ${baseSize * 1.2}px; font-weight: 600;">${monthNames[window.currentMonth!]} ${window.currentYear}</h4>
          <button onclick="navegarMes('next')" class="p-3 rounded-xl gradient-bg text-white hover-lift">›</button>
        </div>
        <div class="grid grid-cols-7 gap-1 mb-2">
          ${dayNames.map(day => `
            <div class="text-center p-2" style="font-size: ${baseSize * 0.8}px; font-weight: 600; opacity: 0.6;">${day}</div>
          `).join("")}
        </div>
        <div class="grid grid-cols-7 gap-1 mb-4">
  `;
  for (let i = 0; i < firstDay; i++) { calendarHTML += "<div></div>"; }
  for (let day = 1; day <= daysInMonth; day++) {
    const status = window.getStatusForDay!(window.selectedAfiliada.id, day, window.currentMonth!, window.currentYear!);
    let statusClass = "day-default-bg";
    let inlineBg = "";
    const dow = new Date(window.currentYear!, window.currentMonth!, day).getDay();
    const isWeekend = dow === 0 || dow === 6;
    if (status) {
      const cls = statusClasses.find((c) => c.key === status);
      if (cls?.bgClass) statusClass = cls.bgClass;
      else if (cls?.bg) { statusClass = ""; inlineBg = cls.bg; }
    } else if (isWeekend) {
      const weekend = statusClasses.find((c) => c.key === "sem_analise");
      if (weekend?.bgClass) statusClass = weekend.bgClass;
      else if (weekend?.bg) { statusClass = ""; inlineBg = weekend.bg; }
      else statusClass = "status-sem-analise";
    }
    calendarHTML += `
      <div class="relative">
        <button onclick="toggleDayMenu(${day})" class="calendar-day w-full aspect-square rounded-xl flex items-center justify-center ${statusClass}" style="${inlineBg ? `background:${inlineBg}; color: white;` : ''} font-size: ${baseSize * 0.9}px; font-weight: 600;">
          ${day}
        </button>
        <div id="day-menu-${day}" class="absolute day-menu top-full left-0 mt-2 rounded-xl shadow-xl border z-20 hidden overflow-hidden" style="min-width: 160px;">
          ${statusClasses.map(sc => `
            <button onclick="marcarDia(${day}, '${sc.key}')" class="w-full text-left px-4 py-3 day-menu-btn transition-all" style="font-size: ${baseSize * 0.85}px;">
              ${sc.label}
            </button>
          `).join("")}
          ${status ? `<button onclick="marcarDia(${day}, null)" class="w-full text-left px-4 py-3 day-menu-btn border-t" style="border-color: var(--calendar-border); font-size: ${baseSize * 0.85}px;">Limpar</button>` : ""}
        </div>
      </div>
    `;
  }
  calendarHTML += `
        </div>
        <div class="grid grid-cols-2 gap-x-4 gap-y-2" style="font-size: ${baseSize * 0.85}px;">
          ${statusClasses.map(sc => `
            <div class="flex items-center gap-2">
              <span class="w-3 h-3 rounded-full ${sc.bgClass || ''}" style="${sc.bg && !sc.bgClass ? `background:${sc.bg}` : ''}"></span>
              <span>${sc.label}</span>
            </div>
          `).join("")}
        </div>
      </div>
    </div>
  `;
  return calendarHTML;
};

window.openLegacyCalendar = function (affiliate: any) {
  ensureStyles();
  window.selectedAfiliada = affiliate;
  window.currentMonth = new Date().getMonth();
  window.currentYear = new Date().getFullYear();

  const overlay = document.createElement("div");
  overlay.id = "legacy-calendar-overlay";
  overlay.className = "fixed inset-0 z-50"; 

  const root = document.createElement("div");
  root.id = "legacy-calendar-root";
  root.innerHTML = window.renderCalendario!();
  
  overlay.appendChild(root);
  document.body.appendChild(overlay);

  const syncTheme = () => {
    const isDark = document.documentElement.classList.contains('dark');
    if (isDark) {
      overlay.classList.add('dark');
    } else {
      overlay.classList.remove('dark');
    }
  };

  syncTheme();

  const themeObserver = new MutationObserver(syncTheme);
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  window.themeObserver = themeObserver;

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      window.fecharCalendario!();
    }
  });
};

export {};
async function ensureMonthLoaded(year: number, month: number) {
  const ym = `${year}-${String(month + 1).padStart(2, "0")}`;
  if (window.__loadedMonths![ym]) return;
  const data = await fetchCalendarStatusesForMonth(year, month);
  window.__calendarStatuses = { ...window.__calendarStatuses, ...data };
  window.__loadedMonths![ym] = true;
}
