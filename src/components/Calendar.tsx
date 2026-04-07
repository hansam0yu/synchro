import { useState } from 'react';
import type { KeyboardEvent } from 'react';
import type { CalEvent } from '../Types.ts';

interface CalendarProps {
  events: Record<string, CalEvent[]>;
  onAddEvent: (dateStr: string, name: string, time: string) => void;
  onDeleteEvent: (dateStr: string, id: number) => void;
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
];

export default function Calendar({ events, onAddEvent, onDeleteEvent }: CalendarProps) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [eventName, setEventName] = useState('');
  const [eventTime, setEventTime] = useState('');

  const todayStr = today.toISOString().slice(0, 10);

  const navigate = (dir: number) => {
    let m = month + dir;
    let y = year;
    if (m > 11) { m = 0; y++; }
    if (m < 0) { m = 11; y--; }
    setMonth(m);
    setYear(y);
    setSelectedDate(null);
  };

  const buildDays = () => {
    const first = new Date(year, month, 1);
    let startDay = first.getDay();
    startDay = startDay === 0 ? 6 : startDay - 1;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrev = new Date(year, month, 0).getDate();

    const cells: { dateStr: string; day: number; type: 'prev' | 'curr' | 'next' }[] = [];

    for (let i = 0; i < startDay; i++) {
      const d = daysInPrev - startDay + i + 1;
      const m2 = month === 0 ? 12 : month;
      const y2 = month === 0 ? year - 1 : year;
      cells.push({ dateStr: `${y2}-${String(m2).padStart(2,'0')}-${String(d).padStart(2,'0')}`, day: d, type: 'prev' });
    }

    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({
        dateStr: `${year}-${String(month + 1).padStart(2,'0')}-${String(d).padStart(2,'0')}`,
        day: d,
        type: 'curr'
      });
    }

    const remaining = cells.length % 7 === 0 ? 0 : 7 - (cells.length % 7);
    for (let d = 1; d <= remaining; d++) {
      const m2 = month === 11 ? 1 : month + 2;
      const y2 = month === 11 ? year + 1 : year;
      cells.push({ dateStr: `${y2}-${String(m2).padStart(2,'0')}-${String(d).padStart(2,'0')}`, day: d, type: 'next' });
    }

    return cells;
  };

  const handleAddEvent = () => {
    if (!eventName.trim() || !selectedDate) return;
    onAddEvent(selectedDate, eventName.trim(), eventTime);
    setEventName('');
    setEventTime('');
  };

  const handleKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleAddEvent();
  };

  const selectedDateLabel = () => {
    if (!selectedDate) return '';
    const d = new Date(selectedDate + 'T00:00:00');
    return d.toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long' });
  };

  const cells = buildDays();

  return (
    <div>
      <div className="page-header">
        <div className="page-title">Calendar</div>
        <div className="page-sub">Plan events across the month</div>
      </div>

      <div className="card">
        <div className="cal-nav">
          <button className="cal-nav-btn" onClick={() => navigate(-1)}>‹</button>
          <div className="cal-month">{MONTHS[month]} {year}</div>
          <button className="cal-nav-btn" onClick={() => navigate(1)}>›</button>
        </div>

        <div className="cal-grid">
          {DAYS.map(d => (
            <div key={d} className="cal-day-header">{d}</div>
          ))}
          {cells.map((cell, i) => {
            const dayEvents = events[cell.dateStr] || [];
            const isToday = cell.dateStr === todayStr;
            const isSel = cell.dateStr === selectedDate;
            const isOther = cell.type !== 'curr';
            return (
              <div
                key={i}
                className={`cal-day ${isOther ? 'other-month' : ''} ${isToday ? 'today' : ''} ${isSel ? 'selected' : ''}`}
                onClick={() => setSelectedDate(cell.dateStr)}
              >
                <div className="cal-day-num">{cell.day}</div>
                {dayEvents.slice(0, 2).map(ev => (
                  <button
                    key={ev.id}
                    className="cal-event"
                    title={ev.name}
                    onClick={e => { e.stopPropagation(); onDeleteEvent(cell.dateStr, ev.id); }}
                  >
                    {ev.time ? `${ev.time} ` : ''}{ev.name}
                  </button>
                ))}
                {dayEvents.length > 2 && (
                  <div style={{ fontSize: 10, color: 'var(--muted)' }}>+{dayEvents.length - 2} more</div>
                )}
              </div>
            );
          })}
        </div>

        {selectedDate && (
          <div className="event-panel">
            <div className="event-panel-title">{selectedDateLabel()}</div>

            {(events[selectedDate] || []).length === 0 ? (
              <div style={{ fontSize: 13, color: 'var(--muted)', padding: '4px 0 8px' }}>
                No events — add one below
              </div>
            ) : (
              (events[selectedDate] || []).map(ev => (
                <div key={ev.id} className="event-list-item">
                  <span>
                    {ev.time && <span className="event-time">{ev.time} · </span>}
                    {ev.name}
                  </span>
                  <button className="btn-danger" onClick={() => onDeleteEvent(selectedDate, ev.id)}>✕</button>
                </div>
              ))
            )}

            <div className="form-row" style={{ marginTop: 12, marginBottom: 0 }}>
              <div className="form-group" style={{ flex: 1 }}>
                <input
                  type="text"
                  value={eventName}
                  onChange={e => setEventName(e.target.value)}
                  onKeyDown={handleKey}
                  placeholder="Event name…"
                  style={{ width: '100%' }}
                />
              </div>
              <div className="form-group">
                <input
                  type="time"
                  value={eventTime}
                  onChange={e => setEventTime(e.target.value)}
                />
              </div>
              <button className="btn btn-primary" onClick={handleAddEvent}>Add</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}