import { useState, useEffect } from 'react';
import './App.css';
import Sidebar from './components/Sidebar.tsx';
import Tasks from './components/Tasks.tsx';
import Calendar from './components/Calendar.tsx';
import Timetable from './components/Timetable.tsx';
import type { Task, CalEvent, TTBlock, Page } from './Types.ts';

function loadStorage<T>(key: string, fallback: T): T {
  try {
    const val = localStorage.getItem(key);
    return val ? JSON.parse(val) : fallback;
  } catch {
    return fallback;
  }
}

export default function App() {
  const [page, setPage] = useState<Page>('tasks');

  const [tasks, setTasks] = useState<Task[]>(() =>
    loadStorage('synchro-tasks', [])
  );
  const [events, setEvents] = useState<Record<string, CalEvent[]>>(() =>
    loadStorage('synchro-events', {})
  );
  const [timetable, setTimetable] = useState<Record<string, TTBlock[]>>(() =>
    loadStorage('synchro-tt', {})
  );

  useEffect(() => { localStorage.setItem('synchro-tasks', JSON.stringify(tasks)); }, [tasks]);
  useEffect(() => { localStorage.setItem('synchro-events', JSON.stringify(events)); }, [events]);
  useEffect(() => { localStorage.setItem('synchro-tt', JSON.stringify(timetable)); }, [timetable]);

  /* ── Task handlers ── */
  const addTask = (title: string, due: string) => {
    setTasks(prev => [{ id: Date.now(), title, due, done: false }, ...prev]);
  };

  const toggleTask = (id: number) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));
  };

  const deleteTask = (id: number) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  /* ── Calendar handlers ── */
  const addEvent = (dateStr: string, name: string, time: string) => {
    setEvents(prev => {
      const updated = [...(prev[dateStr] || []), { id: Date.now(), name, time }];
      updated.sort((a, b) => a.time.localeCompare(b.time));
      return { ...prev, [dateStr]: updated };
    });
  };

  const deleteEvent = (dateStr: string, id: number) => {
    setEvents(prev => ({
      ...prev,
      [dateStr]: (prev[dateStr] || []).filter(e => e.id !== id),
    }));
  };

  /* ── Timetable handlers ── */
  const addBlock = (key: string, name: string, color: string) => {
    setTimetable(prev => ({
      ...prev,
      [key]: [...(prev[key] || []), { id: Date.now(), name, color }],
    }));
  };

  const deleteBlock = (key: string, id: number) => {
    setTimetable(prev => ({
      ...prev,
      [key]: (prev[key] || []).filter(b => b.id !== id),
    }));
  };

  return (
    <div className="app">
      <Sidebar activePage={page} onNavigate={setPage} />
      <main className="main">
        {page === 'tasks' && (
          <Tasks
            tasks={tasks}
            onAdd={addTask}
            onToggle={toggleTask}
            onDelete={deleteTask}
          />
        )}
        {page === 'calendar' && (
          <Calendar
            events={events}
            onAddEvent={addEvent}
            onDeleteEvent={deleteEvent}
          />
        )}
        {page === 'timetable' && (
          <Timetable
            timetable={timetable}
            onAddBlock={addBlock}
            onDeleteBlock={deleteBlock}
          />
        )}
      </main>
    </div>
  );
}