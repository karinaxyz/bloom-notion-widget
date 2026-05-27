import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

const LEGACY_STORAGE_KEY = 'harvest.tasks.v1';
const STORAGE_KEY = 'bloom.tasks.v1';
const assetPath = (filename) => `${import.meta.env.BASE_URL}botanical/${filename}`;

const ART_STAGES = {
  empty: assetPath('07.jpg'),
  zero: assetPath('00.png'),
  twenty: assetPath('02.png'),
  movement: assetPath('08.png'),
  forty: assetPath('04.png'),
  sixty: assetPath('05.png'),
  almost: assetPath('06.png'),
  complete: assetPath('07.jpg'),
};

const STATUS_ICONS = {
  empty: assetPath('icon-1.png'),
  low: assetPath('icon-2.png'),
  medium: assetPath('icon-3.png'),
  complete: assetPath('icon-4.png'),
};

function readTasks() {
  try {
    const storedValue =
      localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
    const stored = JSON.parse(storedValue || '[]');
    const tasks = Array.isArray(stored) ? stored.filter((task) => task?.text) : [];

    if (!localStorage.getItem(STORAGE_KEY) && tasks.length > 0) {
      saveTasks(tasks);
    }

    return tasks;
  } catch {
    return [];
  }
}

function saveTasks(tasks) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function createTask(text) {
  return {
    id: crypto.randomUUID(),
    text: text.trim(),
    completed: false,
  };
}

function getArtwork(tasks) {
  if (tasks.length === 0) return ART_STAGES.empty;

  const completed = tasks.filter((task) => task.completed).length;
  const progress = completed / tasks.length;

  if (progress === 0) return ART_STAGES.zero;
  if (progress <= 0.2) return ART_STAGES.twenty;
  if (progress <= 0.4) return ART_STAGES.movement;
  if (progress <= 0.6) return ART_STAGES.forty;
  if (progress <= 0.8) return ART_STAGES.sixty;
  if (progress < 1) return ART_STAGES.almost;
  return ART_STAGES.complete;
}

function getStatusIcon(tasks) {
  if (tasks.length === 0) return STATUS_ICONS.empty;

  const completed = tasks.filter((task) => task.completed).length;
  const progress = completed / tasks.length;

  if (progress === 0) return STATUS_ICONS.empty;
  if (progress < 0.5) return STATUS_ICONS.low;
  if (progress < 1) return STATUS_ICONS.medium;
  return STATUS_ICONS.complete;
}

function formatToday() {
  const now = new Date();

  return {
    weekday: new Intl.DateTimeFormat(undefined, {
      weekday: 'long',
    }).format(now),
    date: new Intl.DateTimeFormat(undefined, {
      month: 'long',
      day: 'numeric',
    }).format(now),
  };
}

function DisplayDate() {
  const today = formatToday();

  return (
    <header className="date-stack">
      <p className="weekday">{today.weekday}</p>
      <p className="date-line">{today.date}</p>
    </header>
  );
}

function fullDateLabel() {
  return new Intl.DateTimeFormat(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(new Date());
}

function App() {
  const [tasks, setTasks] = useState(readTasks);
  const [draft, setDraft] = useState('');

  const hasTasks = tasks.length > 0;
  const artwork = useMemo(() => getArtwork(tasks), [tasks]);
  const statusIcon = useMemo(() => getStatusIcon(tasks), [tasks]);

  function commitTasks(nextTasks) {
    setTasks(nextTasks);
    saveTasks(nextTasks);
  }

  function addTask(event) {
    event.preventDefault();
    if (!draft.trim()) return;

    commitTasks([...tasks, createTask(draft)]);
    setDraft('');
  }

  function updateTask(id, text) {
    commitTasks(
      tasks.map((task) => (task.id === id ? { ...task, text } : task))
    );
  }

  function settleTask(id, text) {
    const trimmed = text.trim();
    if (!trimmed) {
      removeTask(id);
      return;
    }

    updateTask(id, trimmed);
  }

  function toggleTask(id) {
    commitTasks(
      tasks.map((task) =>
        task.id === id ? { ...task, completed: !task.completed } : task
      )
    );
  }

  function removeTask(id) {
    commitTasks(tasks.filter((task) => task.id !== id));
  }

  function resetList() {
    commitTasks([]);
    setDraft('');
  }

  return (
    <main className="widget" aria-label="Bloom botanical task widget">
      <section className="art-panel" aria-live="polite">
        <DisplayDate />
        <img
          className="botanical-art"
          src={artwork}
          alt={`Botanical illustration showing task progress for ${fullDateLabel()}`}
        />
      </section>

      <section className="task-panel">
        <div className="priority-heading">
          <span className="priority-title">
            <img
              className="status-icon"
              key={statusIcon}
              src={statusIcon}
              alt=""
              aria-hidden="true"
            />
            <h1>Priorities</h1>
          </span>
          {hasTasks && (
            <button
              className="reset-button"
              type="button"
              onClick={resetList}
              aria-label="Reset list"
            >
              ↺
            </button>
          )}
        </div>

        {hasTasks && (
          <div className="task-list" aria-label="Today priorities">
            {tasks.map((task) => (
              <div className="task-row" key={task.id}>
                <button
                  className={task.completed ? 'check-button checked' : 'check-button'}
                  type="button"
                  onClick={() => toggleTask(task.id)}
                  aria-label={task.completed ? 'Mark incomplete' : 'Mark complete'}
                >
                  <span aria-hidden="true" />
                </button>
                <input
                  className={task.completed ? 'task-input done' : 'task-input'}
                  value={task.text}
                  onChange={(event) => updateTask(task.id, event.target.value)}
                  onBlur={(event) => settleTask(task.id, event.target.value)}
                  aria-label="Edit task"
                />
              </div>
            ))}
          </div>
        )}

        <form className="add-form" onSubmit={addTask}>
          <span className="draft-check" aria-hidden="true" />
          <input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Add task"
            aria-label="Add task"
          />
          <button className="submit-hidden" type="submit" aria-label="Add task" />
        </form>
      </section>
    </main>
  );
}

createRoot(document.getElementById('root')).render(<App />);
