import { useState, useRef, useEffect } from "react";
import type { KeyboardEvent } from "react";
import type { TTBlock } from "../Types.ts";

interface TimetableProps {
  timetable: TTBlock[];
  onAddBlock: (
    dayIndex: number,
    startTime: string,
    endTime: string,
    name: string,
    color: string,
  ) => void;
  onDeleteBlock: (id: number) => void;
}

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const TIMES = [
  "6:00",
  "7:00",
  "8:00",
  "9:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
  "19:00",
  "20:00",
  "21:00",
  "22:00",
];
const COLORS = [
  "#3d6b4f",
  "#2563eb",
  "#9333ea",
  "#ea580c",
  "#be185d",
  "#0891b2",
  "#b45309",
];

export default function Timetable({
  timetable,
  onAddBlock,
  onDeleteBlock,
}: TimetableProps) {
  const [pendingCell, setPendingCell] = useState<{
    dayIndex: number;
    time: string;
  } | null>(null);
  const [actName, setActName] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const inputRef = useRef<HTMLInputElement>(null);

  const today = new Date();
  const dow = today.getDay();
  const todayIdx = dow === 0 ? 6 : dow - 1;

  useEffect(() => {
    if (pendingCell && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [pendingCell]);

  const openModal = (dayIndex: number, time: string) => {
    setPendingCell({ dayIndex, time });
    setActName("");
    setStartTime(time);
    // Default end time to 1 hour later
    const timeIdx = TIMES.indexOf(time);
    setEndTime(timeIdx < TIMES.length - 1 ? TIMES[timeIdx + 1] : time);
    setSelectedColor(COLORS[0]);
  };

  const closeModal = () => setPendingCell(null);

  const confirm = () => {
    if (!actName.trim() || !pendingCell) return;
    onAddBlock(
      pendingCell.dayIndex,
      startTime,
      endTime,
      actName.trim(),
      selectedColor,
    );
    closeModal();
  };

  const handleKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") confirm();
    if (e.key === "Escape") closeModal();
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-title">Timetable</div>
        <div className="page-sub">Build your weekly routine</div>
      </div>

      <div className="card">
        <div className="tt-wrap">
          <table className="tt-table">
            <thead>
              <tr>
                <th style={{ width: 50 }}></th>
                {DAYS.map((d, i) => (
                  <th key={d} className={i === todayIdx ? "today-col" : ""}>
                    {d}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {TIMES.map((time, timeIdx) => (
                <tr key={time}>
                  <td className="tt-time">{time}</td>
                  {DAYS.map((_, di) => {
                    // Check if this cell is occupied by a block starting earlier
                    const blockInCell = timetable.find((b) => {
                      if (b.dayIndex !== di) return false;
                      const startIdx = TIMES.indexOf(b.startTime);
                      const endIdx = TIMES.indexOf(b.endTime);
                      return timeIdx >= startIdx && timeIdx < endIdx;
                    });

                    // If cell is covered by a block starting earlier, skip rendering
                    if (blockInCell && blockInCell.startTime !== time) {
                      return null;
                    }

                    // Calculate rowspan if this is the start of a block
                    let rowspan = 1;
                    if (blockInCell) {
                      const startIdx = TIMES.indexOf(blockInCell.startTime);
                      const endIdx = TIMES.indexOf(blockInCell.endTime);
                      rowspan = endIdx - startIdx;
                    }

                    return (
                      <td
                        key={di}
                        className="tt-cell"
                        rowSpan={rowspan}
                        onClick={() => openModal(di, time)}
                      >
                        {blockInCell ? (
                          <div
                            className="tt-block"
                            style={{ background: blockInCell.color }}
                          >
                            <span className="tt-block-name">
                              {blockInCell.name}
                            </span>
                            <button
                              className="tt-block-del"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteBlock(blockInCell.id);
                              }}
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <div className="tt-add-btn">+</div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      <div
        className={`modal-bg ${pendingCell ? "open" : ""}`}
        onClick={(e) => {
          if (e.target === e.currentTarget) closeModal();
        }}
      >
        <div className="modal">
          <div className="modal-title">Add activity</div>
          <div className="form-group" style={{ marginBottom: 12 }}>
            <label className="form-label">Activity name</label>
            <input
              ref={inputRef}
              type="text"
              value={actName}
              onChange={(e) => setActName(e.target.value)}
              onKeyDown={handleKey}
              placeholder="e.g. Gym, Study, Lunch…"
              style={{ width: "100%" }}
            />
          </div>
          <div className="form-row" style={{ marginBottom: 12 }}>
            <div className="form-group">
              <label className="form-label">Start time</label>
              <select
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              >
                {TIMES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">End time</label>
              <select
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              >
                {TIMES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Colour</label>
            <div className="color-picker">
              {COLORS.map((c) => (
                <div
                  key={c}
                  className={`color-dot ${c === selectedColor ? "selected" : ""}`}
                  style={{ background: c }}
                  onClick={() => setSelectedColor(c)}
                />
              ))}
            </div>
          </div>
          <div className="modal-actions">
            <button className="btn btn-ghost" onClick={closeModal}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={confirm}>
              Add
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
