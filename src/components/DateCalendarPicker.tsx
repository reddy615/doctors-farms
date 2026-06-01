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
  theme?: 'booking' | 'admin';
  showLegend?: boolean;
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

function monthGrid(month: Date) {
  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1);
  const gridStart = new Date(firstDay);
  gridStart.setDate(firstDay.getDate() - firstDay.getDay());

  const cells: Date[] = [];
  for (let index = 0; index < 42; index += 1) {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + index);
    cells.push(date);
  }

  return cells;
}

export default function DateCalendarPicker({
  title,
  helperText,
  selectedDates,
  onChange,
  mode,
  disabledDates = [],
  minDate,
  theme = 'booking',
  showLegend = true,
}: DateCalendarPickerProps) {
  const seedDate = selectedDates[0] || minDate || toDateKey(new Date());
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const baseDate = isValidDateKey(seedDate) ? parseDateKey(seedDate) : new Date();
    return startOfMonth(baseDate);
  });

  const selectedSet = new Set(selectedDates);
  const disabledSet = new Set(uniqueDateKeys(disabledDates));
  const minDateKey = minDate && isValidDateKey(minDate) ? minDate : '';
  const today = new Date();
  const todayKey = toDateKey(today);
  const cells = monthGrid(visibleMonth);

  const monthLabel = new Intl.DateTimeFormat('en-US', {
    month: 'long',
    year: 'numeric',
  }).format(visibleMonth);

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
    if (theme === 'admin') {
      return false;
    }

    return disabledSet.has(dateKey) && !selectedSet.has(dateKey);
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-3xl font-semibold leading-tight text-slate-900">{monthLabel}</h3>
          <p className="mt-1 text-sm font-medium text-slate-700">{title}</p>
          {helperText ? <p className="mt-1 text-xs text-slate-500">{helperText}</p> : null}
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setVisibleMonth(clampMonth(today))}
            className="rounded-full border border-slate-200 bg-slate-50 px-4 py-1.5 text-xs font-semibold text-indigo-600 shadow-sm transition hover:bg-slate-100"
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => setVisibleMonth((currentMonth) => clampMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)))}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-700 transition hover:bg-slate-50"
            aria-label="Previous month"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={() => setVisibleMonth((currentMonth) => clampMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)))}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-700 transition hover:bg-slate-50"
            aria-label="Next month"
          >
            ›
          </button>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-7 gap-2 border-y border-slate-200 py-3 text-center text-[12px] font-semibold text-slate-600">
        {weekdayLabels.map((day) => (
          <div key={day} className="py-1">
            {day}
          </div>
        ))}
      </div>

      <div className="mt-3 grid grid-cols-7 gap-y-2 text-center">
        {cells.map((cell) => {
          const dateKey = toDateKey(cell);
          const inCurrentMonth = cell.getMonth() === visibleMonth.getMonth() && cell.getFullYear() === visibleMonth.getFullYear();
          const selected = selectedSet.has(dateKey);
          const blocked = disabledSet.has(dateKey);
          const disabled = !inCurrentMonth || isDisabled(dateKey);
          const showAvailableDot = inCurrentMonth && !blocked && !disabled && !selected;
          const isToday = dateKey === todayKey;
          const selectedClass = theme === 'admin'
            ? 'bg-rose-200 text-rose-900'
            : 'bg-emerald-600 text-white';
          const blockedClass = 'bg-rose-100 text-rose-700';

          return (
            <button
              key={dateKey}
              type="button"
              disabled={disabled}
              onClick={() => changeSelection(dateKey)}
              className={[
                'group relative mx-auto flex h-10 w-10 items-center justify-center rounded-xl text-sm font-semibold transition',
                selected ? selectedClass : '',
                !selected && blocked ? blockedClass : '',
                !selected && !blocked ? 'text-slate-900 hover:bg-slate-100' : '',
                !inCurrentMonth ? 'text-slate-300 hover:bg-transparent' : '',
                disabled && !selected ? 'cursor-not-allowed text-slate-300 hover:bg-transparent' : '',
                isToday && !selected ? 'ring-1 ring-slate-300' : '',
              ].join(' ')}
            >
              {cell.getDate()}
              {showAvailableDot && (
                <span className="absolute bottom-0.5 h-1 w-1 rounded-full bg-emerald-600" />
              )}
            </button>
          );
        })}
      </div>

      {showLegend && (
        <div className="mt-5 flex flex-wrap items-center gap-5 border-t border-slate-200 pt-4 text-sm font-medium text-slate-700">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-white">✓</span>
            <span>Available</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={[
              'inline-flex h-5 w-5 items-center justify-center rounded-full text-white',
              theme === 'admin' ? 'bg-rose-500' : 'bg-emerald-500',
            ].join(' ')}>✓</span>
            <span>{theme === 'admin' ? 'Blocked' : 'Selected'}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-rose-400 text-white">×</span>
            <span>Unavailable</span>
          </div>
        </div>
      )}

      {selectedDates.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {selectedDates.map((dateKey) => (
            <span key={dateKey} className={[
              'rounded-full px-3 py-1 text-xs font-semibold',
              theme === 'admin' ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800',
            ].join(' ')}>
              {dateKey}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
