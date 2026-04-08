import { useState, useEffect } from 'react';
import './App.css';
import Sidebar from './components/Sidebar.tsx';
import Tasks from './components/Tasks.tsx';
import Calendar from './components/Calendar.tsx';
import Timetable from './components/Timetable.tsx';
import GuestBanner from './components/GuestBanner.tsx';
import AuthModal from './components/AuthModal.tsx';
import { useAuth } from './hooks/useAuth';
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
  const { user, loading, signIn, signUp, signOut } = useAuth();
  const [page, setPage] = useState<Page>('tasks');
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const [tasks, setTasks] = useState<Task[]>(() =>
    loadStorage('synchro-tasks', [])
  );
  const [events, setEvents] = useState<Record<string, CalEvent[]>>(() =>
    loadStorage('synchro-events', {})
  );
  const [timetable, setTimetable] = useState<Record<string, TTBlock[]>>(() =>
    loadStorage('synchro-tt', {})
  );

  // Guest mode: persist to localStorage
  useEffect(() => { localStorage.setItem('synchro-tasks', JSON.stringify(tasks)); }, [tasks]);
  useEffect(() => { localStorage.setItem('synchro-events', JSON.stringify(events)); }, [events]);
  useEffect(() => { localStorage.setItem('synchro-tt', JSON.stringify(timetable)); }, [timetable]);

  // TODO: When user is logged in, sync data with Supabase instead of localStorage
  // useEffect(() => {
  //   if (user) {
  //     // Load user's data from Supabase
  //     // loadUserData(user.id).then(data => {
  //     //   setTasks(data.tasks);
  //     //   setEvents(data.events);
  //     //   setTimetable(data.timetable);
  //     // });
  //   }
  // }, [user]);

  /* ── Task handlers ── */
  const addTask = (title: string, due: string) => {
    const newTask = { id: Date.now(), title, due, done: false };
    setTasks(prev => [newTask, ...prev]);
    // TODO: If user is logged in, also save to Supabase
  };

  const toggleTask = (id: number) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));
    // TODO: If user is logged in, also update in Supabase
  };

  const deleteTask = (id: number) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    // TODO: If user is logged in, also delete from Supabase
  };

  /* ── Calendar handlers ── */
  const addEvent = (dateStr: string, name: string, time: string) => {
    setEvents(prev => {
      const updated = [...(prev[dateStr] || []), { id: Date.now(), name, time }];
      updated.sort((a, b) => a.time.localeCompare(b.time));
      return { ...prev, [dateStr]: updated };
    });
    // TODO: If user is logged in, also save to Supabase
  };

  const deleteEvent = (dateStr: string, id: number) => {
    setEvents(prev => ({
      ...prev,
      [dateStr]: (prev[dateStr] || []).filter(e => e.id !== id),
    }));
    // TODO: If user is logged in, also delete from Supabase
  };

  /* ── Timetable handlers ── */
  const addBlock = (key: string, name: string, color: string) => {
    setTimetable(prev => ({
      ...prev,
      [key]: [...(prev[key] || []), { id: Date.now(), name, color }],
    }));
    // TODO: If user is logged in, also save to Supabase
  };

  const deleteBlock = (key: string, id: number) => {
    setTimetable(prev => ({
      ...prev,
      [key]: (prev[key] || []).filter(b => b.id !== id),
    }));
    // TODO: If user is logged in, also delete from Supabase
  };

  if (loading) {
    return null; // Or a loading spinner
  }

  return (
    <div className="app">
      <Sidebar
        activePage={page}
        onNavigate={setPage}
        user={user}
        onSignInClick={() => setAuthModalOpen(true)}
        onSignOut={signOut}
      />
      <main className="main">
        {!user && <GuestBanner />}

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

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSignIn={signIn}
        onSignUp={signUp}
      />
    </div>
  );
}