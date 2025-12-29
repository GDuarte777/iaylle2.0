"use client";

import { useEffect, useRef, useState } from "react";
import { Calendar as CalendarIcon, X } from "lucide-react";

export function AffiliateCalendarModal({ isOpen, onClose, affiliate }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [opts, setOpts] = useState({
    month: new Date().getMonth(),
    year: new Date().getFullYear(),
    date: new Date().getDate(),
    monthformat: "full",
    highlighttoday: true,
    highlighttargetdate: false,
    prevnextbutton: "show",
    todaybutton: "show",
  });

  useEffect(() => {
    if (!isOpen || !containerRef.current) return;

    const monthName = {
      full: ["January","February","March","April","May","June","July","August","September","October","November","December"],
      mmm: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],
    };
    const dayName = { d: ["S","M","T","W","T","F","S"] };

    function getCalendar(year: number, month: number, date: number) {
      const dateObj = new Date();
      const result: any = {};
      result.today = { date: dateObj.getDate(), monthIndex: dateObj.getMonth(), year: dateObj.getFullYear() };
      dateObj.setFullYear(year);
      dateObj.setMonth(month);
      dateObj.setDate(1);
      result.firstDayIndex = dateObj.getDay();
      result.monthIndex = month;
      result.year = year;
      dateObj.setMonth(month + 1);
      dateObj.setDate(0);
      result.totaldays = dateObj.getDate();
      return result;
    }

    function createMonthTable(data: any, option: any) {
      const table = document.createElement("table");
      let tr = document.createElement("tr");
      for (let c = 0; c <= 6; c++) {
        const td = document.createElement("td");
        td.innerHTML = dayName.d[c];
        tr.appendChild(td);
      }
      table.appendChild(tr);

      tr = document.createElement("tr");
      let c = 0;
      for (; c < data.firstDayIndex; c++) {
        const td = document.createElement("td");
        tr.appendChild(td);
      }
      let count = 1;
      while (c <= 6) {
        const td = document.createElement("td");
        td.innerHTML = String(count);
        if (option.highlighttoday && data.today.date === count && data.today.monthIndex === data.monthIndex) {
          td.classList.add("dycalendar-today-date");
        }
        if (option.highlighttargetdate && option.date === count && data.monthIndex === option.month) {
          td.classList.add("dycalendar-target-date");
        }
        tr.appendChild(td);
        count++;
        c++;
      }
      table.appendChild(tr);

      for (let r = 3; r <= 7; r++) {
        if (count > data.totaldays) break;
        tr = document.createElement("tr");
        for (let ci = 0; ci <= 6; ci++) {
          if (count > data.totaldays) break;
          const td = document.createElement("td");
          td.innerHTML = String(count);
          if (option.highlighttoday && data.today.date === count && data.today.monthIndex === data.monthIndex) {
            td.classList.add("dycalendar-today-date");
          }
          if (option.highlighttargetdate && option.date === count && data.monthIndex === option.month) {
            td.classList.add("dycalendar-target-date");
          }
          tr.appendChild(td);
          count++;
        }
        table.appendChild(tr);
      }
      return table;
    }

    function drawCalendarMonthTable(data: any, option: any) {
      const container = document.createElement("div");
      container.className = "dycalendar-month-container";

      const header = document.createElement("div");
      header.className = "dycalendar-header";
      header.setAttribute("data-option", JSON.stringify(option));

      if (option.prevnextbutton === "show") {
        const prev = document.createElement("span");
        prev.className = "dycalendar-prev-next-btn prev-btn";
        prev.setAttribute("data-btn", "prev");
        prev.textContent = "<";
        header.appendChild(prev);
      }

      const monthYear = document.createElement("span");
      monthYear.className = "dycalendar-span-month-year";
      monthYear.textContent = option.monthformat === "full"
        ? monthName.full[data.monthIndex] + " " + data.year
        : monthName.mmm[data.monthIndex] + " " + data.year;
      header.appendChild(monthYear);

      if (option.prevnextbutton === "show") {
        const next = document.createElement("span");
        next.className = "dycalendar-prev-next-btn next-btn";
        next.setAttribute("data-btn", "next");
        next.textContent = ">";
        header.appendChild(next);
      }

      container.appendChild(header);

      if (option.todaybutton === "show") {
        const todayDiv = document.createElement("div");
        todayDiv.className = "dycalendar-today-btn";
        const todayBtn = document.createElement("span");
        todayBtn.className = "today-btn";
        todayBtn.setAttribute("data-btn", "today");
        todayBtn.textContent = "Today";
        todayDiv.appendChild(todayBtn);
        container.appendChild(todayDiv);
      }

      const body = document.createElement("div");
      body.className = "dycalendar-body";
      body.appendChild(createMonthTable(data, option));
      container.appendChild(body);

      return container;
    }

    function drawCalendar(option: any) {
      const data = getCalendar(option.year, option.month, option.date);
      const cal = drawCalendarMonthTable(data, option);
      const target = containerRef.current!;
      target.innerHTML = "";
      target.appendChild(cal);
    }

    function onClick() {
      const root = containerRef.current!;
      root.addEventListener("click", (e: any) => {
        const target = e.target as HTMLElement;
        if (target.classList.contains("dycalendar-prev-next-btn")) {
          const opts = JSON.parse(target.parentElement!.getAttribute("data-option") || "{}");
          const btn = target.getAttribute("data-btn");
          const delta = btn === "prev" ? -1 : 1;
          const d = new Date(opts.year, opts.month + delta, 1);
          const next = { ...opts, month: d.getMonth(), year: d.getFullYear() };
          setOpts(next);
          drawCalendar(next);
        } else if (target.classList.contains("today-btn")) {
          const today = new Date();
          const next = { ...opts, date: today.getDate(), month: today.getMonth(), year: today.getFullYear() };
          setOpts(next);
          drawCalendar(next);
        } else if (target.tagName === "TD" && target.innerHTML) {
          // toggle target date highlight
          const day = Number(target.innerHTML);
          const next = { ...opts, highlighttargetdate: true, date: day };
          setOpts(next);
          drawCalendar(next);
        }
      });
    }

    onClick();
    drawCalendar(opts);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="rounded-2xl shadow-xl w-full max-w-md mx-auto p-6 relative" style={{ background: "linear-gradient(135deg, #9b184e 0%, #e75761 100%)" }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 flex items-center justify-center bg-white rounded-lg">
              <CalendarIcon className="w-5 h-5 text-[#e75761]" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{affiliate?.name}</h2>
              <p className="text-white/80 text-sm">Marque as postagens do mês</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white hover:text-white/90 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div id="dycalendar" ref={containerRef} className="bg-white/10 rounded-xl p-4"></div>

        <style>{`
          #dycalendar table { width: 100%; border-spacing: 8px; }
          #dycalendar table tr:nth-child(1) td { background: #fff; color: #111; border-radius: 4px; font-weight: 600; }
          #dycalendar table td { color: #fff; padding: 10px; cursor: pointer; border-radius: 4px; }
          #dycalendar table td:hover { background: #fff; color: #111 !important; }
          .dycalendar-today-date, .dycalendar-target-date { background: #fff !important; color: #111 !important; border-radius: 8px; }
          .dycalendar-prev-next-btn.prev-btn, .dycalendar-prev-next-btn.next-btn { background: #fff; color: #111; width: 44px; height: 38px; border-radius: 4px; font-size: 24px; display: flex; align-items: center; justify-content: center; }
          .dycalendar-span-month-year { color: #fff; font-size: 1.5em; font-weight: 500; }
          .dycalendar-today-btn .today-btn { background: #fff; color: #111; border-radius: 4px; padding: 5px; cursor: pointer; }
          .dycalendar-header, .dycalendar-body, .dycalendar-today-btn { display: flex; align-items: center; justify-content: center; gap: 12px; }
          .dycalendar-month-container { display: flex; flex-direction: column; gap: 10px; }
        `}</style>
      </div>
    </div>
  );
}
