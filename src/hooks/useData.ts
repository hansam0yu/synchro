import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import type { Task, CalEvent, TTBlock, User } from "../Types";

function loadLocal<T>(key: string, fallback: T): T {
  try {
    const val = localStorage.getItem(key);
    return val ? JSON.parse(val) : fallback;
  } catch {
    return fallback;
  }
}

export function useData(user: User | null) {
  const [tasks, setTasksState] = useState<Task[]>([]);
  const [events, setEventsState] = useState<Record<string, CalEvent[]>>({});
  const [timetable, setTimetableState] = useState<Record<string, TTBlock[]>>(
    {},
  );
  const [loading, setLoading] = useState(true);

  // Load data when user state changes
  useEffect(() => {
    if (user) {
      loadFromSupabase();
    } else {
      setTasksState(loadLocal("synchro-tasks", []));
      setEventsState(loadLocal("synchro-events", {}));
      setTimetableState(loadLocal("synchro-tt", {}));
      setLoading(false);
    }
  }, [user]);

  const loadFromSupabase = async () => {
    setLoading(true);
    const [{ data: taskData }, { data: eventData }, { data: ttData }] =
      await Promise.all([
        supabase
          .from("tasks")
          .select("*")
          .order("created_at", { ascending: false }),
        supabase.from("events").select("*"),
        supabase.from("timetable_blocks").select("*"),
      ]);

    if (taskData) setTasksState(taskData);

    // Convert flat event rows into the Record<dateStr, CalEvent[]> shape
    if (eventData) {
      const grouped: Record<string, CalEvent[]> = {};
      eventData.forEach((e) => {
        if (!grouped[e.date]) grouped[e.date] = [];
        grouped[e.date].push({ id: e.id, name: e.name, time: e.time });
      });
      setEventsState(grouped);
    }

    // Convert flat timetable rows into Record<key, TTBlock[]> shape
    if (ttData) {
      const grouped: Record<string, TTBlock[]> = {};
      ttData.forEach((b) => {
        const key = `${b.day_index}-${b.time_slot}`;
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push({ id: b.id, name: b.name, color: b.color });
      });
      setTimetableState(grouped);
    }

    setLoading(false);
  };

  /* ── Task handlers ── */
  const addTask = async (title: string, due: string) => {
    if (user) {
      const { data } = await supabase
        .from("tasks")
        .insert({ user_id: user.id, title, due, done: false })
        .select()
        .single();
      if (data) setTasksState((prev) => [data, ...prev]);
    } else {
      const t: Task = { id: Date.now(), title, due, done: false };
      setTasksState((prev) => {
        const updated = [t, ...prev];
        localStorage.setItem("synchro-tasks", JSON.stringify(updated));
        return updated;
      });
    }
  };

  const toggleTask = async (id: number) => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;
    if (user) {
      await supabase.from("tasks").update({ done: !task.done }).eq("id", id);
    }
    setTasksState((prev) => {
      const updated = prev.map((t) =>
        t.id === id ? { ...t, done: !t.done } : t,
      );
      if (!user) localStorage.setItem("synchro-tasks", JSON.stringify(updated));
      return updated;
    });
  };

  const deleteTask = async (id: number) => {
    if (user) await supabase.from("tasks").delete().eq("id", id);
    setTasksState((prev) => {
      const updated = prev.filter((t) => t.id !== id);
      if (!user) localStorage.setItem("synchro-tasks", JSON.stringify(updated));
      return updated;
    });
  };

  /* ── Calendar handlers ── */
  const addEvent = async (dateStr: string, name: string, time: string) => {
    if (user) {
      const { data } = await supabase
        .from("events")
        .insert({ user_id: user.id, date: dateStr, name, time })
        .select()
        .single();
      if (data) {
        setEventsState((prev) => {
          const updated = {
            ...prev,
            [dateStr]: [
              ...(prev[dateStr] || []),
              { id: data.id, name, time },
            ].sort((a, b) => a.time.localeCompare(b.time)),
          };
          return updated;
        });
      }
    } else {
      setEventsState((prev) => {
        const updated = {
          ...prev,
          [dateStr]: [
            ...(prev[dateStr] || []),
            { id: Date.now(), name, time },
          ].sort((a, b) => a.time.localeCompare(b.time)),
        };
        localStorage.setItem("synchro-events", JSON.stringify(updated));
        return updated;
      });
    }
  };

  const deleteEvent = async (dateStr: string, id: number) => {
    if (user) await supabase.from("events").delete().eq("id", id);
    setEventsState((prev) => {
      const updated = {
        ...prev,
        [dateStr]: (prev[dateStr] || []).filter((e) => e.id !== id),
      };
      if (!user)
        localStorage.setItem("synchro-events", JSON.stringify(updated));
      return updated;
    });
  };

  /* ── Timetable handlers ── */
  const addBlock = async (key: string, name: string, color: string) => {
    const [dayIndex, timeSlot] = key.split(/-(.+)/);
    if (user) {
      const { data } = await supabase
        .from("timetable_blocks")
        .insert({
          user_id: user.id,
          day_index: parseInt(dayIndex),
          time_slot: timeSlot,
          name,
          color,
        })
        .select()
        .single();
      if (data) {
        setTimetableState((prev) => ({
          ...prev,
          [key]: [...(prev[key] || []), { id: data.id, name, color }],
        }));
      }
    } else {
      setTimetableState((prev) => {
        const updated = {
          ...prev,
          [key]: [...(prev[key] || []), { id: Date.now(), name, color }],
        };
        localStorage.setItem("synchro-tt", JSON.stringify(updated));
        return updated;
      });
    }
  };

  const deleteBlock = async (key: string, id: number) => {
    if (user) await supabase.from("timetable_blocks").delete().eq("id", id);
    setTimetableState((prev) => {
      const updated = {
        ...prev,
        [key]: (prev[key] || []).filter((b) => b.id !== id),
      };
      if (!user) localStorage.setItem("synchro-tt", JSON.stringify(updated));
      return updated;
    });
  };

  return {
    tasks,
    events,
    timetable,
    loading,
    addTask,
    toggleTask,
    deleteTask,
    addEvent,
    deleteEvent,
    addBlock,
    deleteBlock,
  };
}
