import React, { useMemo } from 'react';
import { Calendar } from 'lucide-react';

export interface QuickDateOption {
  dateStr: string;
  title: string;
  badge: string;
  dayOfWeek: string;
}

export interface QuickDateButtonsProps {
  selectedDate: string;
  onSelectDate: (dateStr: string) => void;
  className?: string;
  showCustomInput?: boolean;
}

export const QuickDateButtons: React.FC<QuickDateButtonsProps> = ({
  selectedDate,
  onSelectDate,
  className = '',
  showCustomInput = false,
}) => {
  const options = useMemo<QuickDateOption[]>(() => {
    const daysShort = ['Dom', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    const list: QuickDateOption[] = [];
    const now = new Date();

    for (let offset = 0; offset < 4; offset++) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset, 12, 0, 0);
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const dayFormatted = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
      const dayName = daysShort[d.getDay()];

      let title = '';
      if (offset === 0) {
        title = 'Hoje';
      } else if (offset === 1) {
        title = 'Amanhã';
      } else if (offset === 2) {
        // Depois de amanhã (com nome do dia da semana)
        title = dayName;
      } else {
        // Depois de depois de amanhã (com nome do dia da semana)
        title = dayName;
      }

      list.push({
        dateStr,
        title,
        badge: dayFormatted,
        dayOfWeek: dayName,
      });
    }

    return list;
  }, []);

  return (
    <div className={`space-y-1.5 ${className}`}>
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
        {options.map((opt) => {
          const isSelected = selectedDate === opt.dateStr;
          return (
            <button
              key={opt.dateStr}
              type="button"
              onClick={() => onSelectDate(opt.dateStr)}
              className={`flex-1 min-w-[76px] py-1.5 px-2 rounded-xl text-xs font-bold transition-all border text-center flex flex-col items-center justify-center gap-0.5 select-none ${
                isSelected
                  ? 'bg-brand-500 text-dark-950 border-brand-400 shadow-glow-brand ring-1 ring-brand-300'
                  : 'bg-dark-950/80 hover:bg-dark-900 border-white/10 text-slate-300 hover:text-white hover:border-white/20'
              }`}
            >
              <span className="font-extrabold text-[11px] leading-none whitespace-nowrap">
                {opt.title}
              </span>
              <span
                className={`text-[9px] font-mono leading-none ${
                  isSelected ? 'text-dark-950/80 font-bold' : 'text-slate-400'
                }`}
              >
                {opt.badge}
              </span>
            </button>
          );
        })}

        {showCustomInput && (
          <div className="relative flex-shrink-0">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => e.target.value && onSelectDate(e.target.value)}
              className="sr-only"
              id="quick-date-calendar-input"
            />
            <label
              htmlFor="quick-date-calendar-input"
              className={`h-[42px] px-2.5 rounded-xl border flex items-center justify-center cursor-pointer transition-all ${
                !options.some((o) => o.dateStr === selectedDate)
                  ? 'bg-brand-500 text-dark-950 border-brand-400 shadow-glow-brand'
                  : 'bg-dark-950/80 hover:bg-dark-900 border-white/10 text-slate-400 hover:text-white'
              }`}
              title="Escolher outra data no calendário"
            >
              <Calendar className="w-4 h-4" />
            </label>
          </div>
        )}
      </div>
    </div>
  );
};
