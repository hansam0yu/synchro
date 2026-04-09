import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import type { Task, CalEvent, TTBlock, User, Category } from "../Types";

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
  const [categories, setCategoriesState] = useState<Category[]>([]);
  const [events, setEventsState] = useState<Record<string, CalEvent[]>>({});
  const [timetable, setTimetableState] = useState<Record<string, TTBlock[]>>(
    {},
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadFromSupabase();
    } else {
      setCategoriesState(loadLocal<Category[]>("synchro-categories", []));
      setTasksState(loadLocal("synchro-tasks", []));
      setEventsState(loadLocal("synchro-events", {}));
      setTimetableState(loadLocal("synchro-tt", {}));
      setLoading(false);
    }
  }, [user?.id]);

  const loadFromSupabase = async () => {
    setLoading(true);
    try {
      const [
        { data: catData, error: catError },
        { data: taskData, error: taskError },
        { data: eventData, error: eventError },
        { data: ttData, error: ttError },
      ] = await Promise.all([
        supabase
          .from("categories")
          .select("*")
          .order("created_at", { ascending: true }),
        supabase
          .from("tasks")
          .select("*")
          .order("created_at", { ascending: false }),
        supabase.from("events").select("*"),
        supabase.from("timetable_blocks").select("*"),
      ]);

      if (catError) console.error("Error loading categories:", catError);
      if (taskError) console.error("Error loading tasks:", taskError);
      if (eventError) console.error("Error loading events:", eventError);
      if (ttError) console.error("Error loading timetable:", ttError);

      if (catData) {
        setCategoriesState(
          catData.map((c) => ({ id: c.id, name: c.name, color: c.color })),
        );
      }

      if (taskData) {
        setTasksState(
          taskData.map((t) => ({
            id: t.id,
            title: t.title,
            due: t.due ?? "",
            done: t.done,
            categoryId: t.category_id ?? "general",
          })),
        );
      }

      if (eventData) {
        const grouped: Record<string, CalEvent[]> = {};
        eventData.forEach((e) => {
          if (!grouped[e.date]) grouped[e.date] = [];
          grouped[e.date].push({ id: e.id, name: e.name, time: e.time ?? "" });
        });
        setEventsState(grouped);
      }

      if (ttData) {
        const grouped: Record<string, TTBlock[]> = {};
        ttData.forEach((b) => {
          const key = `${b.day_index}-${b.time_slot}`;
          if (!grouped[key]) grouped[key] = [];
          grouped[key].push({ id: b.id, name: b.name, color: b.color });
        });
        setTimetableState(grouped);
      }
    } catch (err) {
      console.error("Unexpected error loading data:", err);
    } finally {
      setLoading(false);
    }
  };

  /* ── Category handlers ── */
  const addCategory = async (name: string, color: string) => {
    if (user) {
      const { data, error } = await supabase
        .from("categories")
        .insert({ user_id: user.id, name, color })
        .select()
        .single();

      if (error) {
        console.error("Failed to add category:", error);
      } else if (data) {
        setCategoriesState((prev) => [
          ...prev,
          { id: data.id, name: data.name, color: data.color },
        ]);
      }
    } else {
      const newCat: Category = { id: `cat-${Date.now()}`, name, color };
      setCategoriesState((prev) => {
        const updated = [...prev, newCat];
        localStorage.setItem("synchro-categories", JSON.stringify(updated));
        return updated;
      });
    }
  };

  const deleteCategory = async (id: string) => {
    if (user) {
      // Optimistically update UI (DB handles task category_id via ON DELETE SET NULL)
      setCategoriesState((prev) => prev.filter((c) => c.id !== id));
      setTasksState((prev) =>
        prev.map((t) =>
          t.categoryId === id ? { ...t, categoryId: "general" } : t,
        ),
      );
      const { error } = await supabase.from("categories").delete().eq("id", id);
      if (error) console.error("Failed to delete category:", error);
    } else {
      setTasksState((prev) => {
        const updated = prev.map((t) =>
          t.categoryId === id ? { ...t, categoryId: "general" } : t,
        );
        localStorage.setItem("synchro-tasks", JSON.stringify(updated));
        return updated;
      });
      setCategoriesState((prev) => {
        const updated = prev.filter((c) => c.id !== id);
        localStorage.setItem("synchro-categories", JSON.stringify(updated));
        return updated;
      });
    }
  };

  /* ── Task handlers ── */
  const addTask = async (
    title: string,
    due: string,
    categoryId: string = "general",
  ) => {
    if (user) {
      const tempId = Date.now();
      setTasksState((prev) => [
        { id: tempId, title, due, done: false, categoryId },
        ...prev,
      ]);

      const { data, error } = await supabase
        .from("tasks")
        .insert({
          user_id: user.id,
          title,
          due: due || null,
          done: false,
          category_id: categoryId !== "general" ? categoryId : null,
        })
        .select()
        .single();

      if (error) {
        console.error("Failed to add task:", error);
      } else if (data) {
        setTasksState((prev) =>
          prev.map((t) =>
            t.id === tempId
              ? {
                  id: data.id,
                  title: data.title,
                  due: data.due ?? "",
                  done: data.done,
                  categoryId,
                }
              : t,
          ),
        );
      }
    } else {
      const t: Task = { id: Date.now(), title, due, done: false, categoryId };
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
    const newDone = !task.done;

    setTasksState((prev) => {
      const updated = prev.map((t) =>
        t.id === id ? { ...t, done: newDone } : t,
      );
      if (!user) localStorage.setItem("synchro-tasks", JSON.stringify(updated));
      return updated;
    });

    if (user) {
      const { error } = await supabase
        .from("tasks")
        .update({ done: newDone })
        .eq("id", id);
      if (error) console.error("Failed to toggle task:", error);
    }
  };

  const deleteTask = async (id: number) => {
    setTasksState((prev) => {
      const updated = prev.filter((t) => t.id !== id);
      if (!user) localStorage.setItem("synchro-tasks", JSON.stringify(updated));
      return updated;
    });

    if (user) {
      const { error } = await supabase.from("tasks").delete().eq("id", id);
      if (error) console.error("Failed to delete task:", error);
    }
  };

  /* ── Calendar handlers ── */
  const addEvent = async (dateStr: string, name: string, time: string) => {
    if (user) {
      const tempId = Date.now();
      setEventsState((prev) => ({
        ...prev,
        [dateStr]: [...(prev[dateStr] || []), { id: tempId, name, time }].sort(
          (a, b) => (a.time || "").localeCompare(b.time || ""),
        ),
      }));

      const { data, error } = await supabase
        .from("events")
        .insert({ user_id: user.id, date: dateStr, name, time: time || null })
        .select()
        .single();

      if (error) {
        console.error("Failed to add event:", error);
      } else if (data) {
        setEventsState((prev) => ({
          ...prev,
          [dateStr]: (prev[dateStr] || []).map((e) =>
            e.id === tempId
              ? { id: data.id, name: data.name, time: data.time ?? "" }
              : e,
          ),
        }));
      }
    } else {
      setEventsState((prev) => {
        const updated = {
          ...prev,
          [dateStr]: [
            ...(prev[dateStr] || []),
            { id: Date.now(), name, time },
          ].sort((a, b) => (a.time || "").localeCompare(b.time || "")),
        };
        localStorage.setItem("synchro-events", JSON.stringify(updated));
        return updated;
      });
    }
  };

  const deleteEvent = async (dateStr: string, id: number) => {
    setEventsState((prev) => {
      const updated = {
        ...prev,
        [dateStr]: (prev[dateStr] || []).filter((e) => e.id !== id),
      };
      if (!user)
        localStorage.setItem("synchro-events", JSON.stringify(updated));
      return updated;
    });

    if (user) {
      const { error } = await supabase.from("events").delete().eq("id", id);
      if (error) console.error("Failed to delete event:", error);
    }
  };

  /* ── Timetable handlers ── */
  const addBlock = async (key: string, name: string, color: string) => {
    const [dayIndex, timeSlot] = key.split(/-(.+)/);

    if (user) {
      const tempId = Date.now();
      setTimetableState((prev) => ({
        ...prev,
        [key]: [...(prev[key] || []), { id: tempId, name, color }],
      }));

      const { data, error } = await supabase
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

      if (error) {
        console.error("Failed to add block:", error);
      } else if (data) {
        setTimetableState((prev) => ({
          ...prev,
          [key]: (prev[key] || []).map((b) =>
            b.id === tempId
              ? { id: data.id, name: data.name, color: data.color }
              : b,
          ),
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
    setTimetableState((prev) => {
      const updated = {
        ...prev,
        [key]: (prev[key] || []).filter((b) => b.id !== id),
      };
      if (!user) localStorage.setItem("synchro-tt", JSON.stringify(updated));
      return updated;
    });

    if (user) {
      const { error } = await supabase
        .from("timetable_blocks")
        .delete()
        .eq("id", id);
      if (error) console.error("Failed to delete block:", error);
    }
  };

  return {
    tasks,
    categories,
    events,
    timetable,
    loading,
    addTask,
    toggleTask,
    deleteTask,
    addCategory,
    deleteCategory,
    addEvent,
    deleteEvent,
    addBlock,
    deleteBlock,
  };
}
