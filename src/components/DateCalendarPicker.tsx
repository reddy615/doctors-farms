import { useState } from 'react';
import { parseDateKey, toDateKey, uniqueDateKeys } from '../utils/dateHelpers';

type DateCalendarPickerProps = {
  title: string;
  helperText?: string;
  selectedDates: string[];
  onChange: (dates: string[]) => void;
  mode: 'single' | 'multiple';
  disabledDates?: string[];
  minDate?: string;
};

const weekdayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function isValidDateKey(dateKey: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(dateKey);
}

function clampMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export default function DateCalendarPicker({
  title,
  helperText,
  selectedDates,
  onChange,
  mode,
  disabledDates = [],
  minDate,
}: DateCalendarPickerProps) {
  const seedDate = selectedDates[0] || minDate || toDateKey(new Date());
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const baseDate = isValidDateKey(seedDate) ? parseDateKey(seedDate) : new Date();
    return startOfMonth(baseDate);
  });

  const selectedSet = new Set(selectedDates);
  const disabledSet = new Set(uniqueDateKeys(disabledDates));
  const minDateKey = minDate && isValidDateKey(minDate) ? minDate : '';

  const monthLabel = new Intl.DateTimeFormat('en-US', {
    month: 'long',
    year: 'numeric',
  }).format(visibleMonth);

  const daysInMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 0).getDate();
  const startDay = visibleMonth.getDay();
  const calendarCells = [] as Array<{ dateKey?: string; day?: number }>; 

  for (let index = 0; index < startDay; index += 1) {
    calendarCells.push({});
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), day);
    calendarCells.push({ dateKey: toDateKey(date), day });
  }

  const changeSelection = (dateKey: string) => {
    if (!dateKey) return;

    if (mode === 'multiple') {
      const nextDates = selectedSet.has(dateKey)
        ? selectedDates.filter((item) => item !== dateKey)
        : [...selectedDates, dateKey];

      onChange(uniqueDateKeys(nextDates));
      return;
    }

    onChange([dateKey]);
  };

  const isDisabled = (dateKey: string) => {
    if (!dateKey) return true;
    if (minDateKey && dateKey < minDateKey) return true;
    return disabledSet.has(dateKey) && !selectedSet.has(dateKey);
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
          {helperText ? <p className="mt-1 text-xs text-slate-500">{helperText}</p> : null}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setVisibleMonth((currentMonth) => clampMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)))}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:bg-slate-50"
            aria-label="Previous month"
          >
            ‹
          </button>
          <span className="min-w-[140px] text-center text-sm font-semibold text-slate-900">{monthLabel}</span>
          <button
            type="button"
            onClick={() => setVisibleMonth((currentMonth) => clampMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)))}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:bg-slate-50"
            aria-label="Next month"
          >
            ›
          </button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-7 gap-1 text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
        {weekdayLabels.map((day) => (
          <div key={day} className="py-1">
            {day}
          </div>
        ))}
      </div>

      <div className="mt-2 grid grid-cols-7 gap-1">
        {calendarCells.map((cell, index) => {
          if (!cell.dateKey) {
            return <div key={`blank-${index}`} className="h-10 rounded-xl" />;
          }

          const selected = selectedSet.has(cell.dateKey);
          const disabled = isDisabled(cell.dateKey);

          return (
            <button
              key={cell.dateKey}
              type="button"
              disabled={disabled}
              onClick={() => changeSelection(cell.dateKey!)}
              className={[
                'h-10 rounded-xl border text-sm font-semibold transition',
                selected ? 'border-emerald-600 bg-emerald-50 text-emerald-800' : 'border-slate-200 bg-white text-slate-700 hover:border-emerald-300 hover:bg-emerald-50/70',
                disabled ? 'cursor-not-allowed border-slate-100 bg-slate-100 text-slate-400 hover:border-slate-100 hover:bg-slate-100' : '',
              ].join(' ')}
            >
              {cell.day}
            </button>
          );
        })}
      </div>

      {selectedDates.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {selectedDates.map((dateKey) => (
            <span key={dateKey} className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
              {dateKey}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
