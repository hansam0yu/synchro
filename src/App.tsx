import { useState } from "react";
import "./App.css";
import Sidebar from "./components/Sidebar.tsx";
import Tasks from "./components/Tasks.tsx";
import Calendar from "./components/Calendar.tsx";
import Timetable from "./components/Timetable.tsx";
import GuestBanner from "./components/GuestBanner.tsx";
import AuthModal from "./components/AuthModal.tsx";
import { useAuth } from "./hooks/useAuth";
import { useData } from "./hooks/useData";
import type { Page } from "./Types.ts";

export default function App() {
  const { user, loading: authLoading, signIn, signUp, signOut } = useAuth();
  const {
    tasks,
    events,
    timetable,
    loading: dataLoading,
    addTask,
    toggleTask,
    deleteTask,
    addEvent,
    deleteEvent,
    addBlock,
    deleteBlock,
  } = useData(user);
  const [page, setPage] = useState<Page>("tasks");
  const [authModalOpen, setAuthModalOpen] = useState(false);

  if (authLoading || dataLoading) {
    return null;
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

        {page === "tasks" && (
          <Tasks
            tasks={tasks}
            onAdd={addTask}
            onToggle={toggleTask}
            onDelete={deleteTask}
          />
        )}
        {page === "calendar" && (
          <Calendar
            events={events}
            onAddEvent={addEvent}
            onDeleteEvent={deleteEvent}
          />
        )}
        {page === "timetable" && (
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
