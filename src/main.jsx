import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

const LEGACY_STORAGE_KEY = 'harvest.tasks.v1';
const STORAGE_KEY = 'bloom.tasks.v1';
const bloomAssetPath = (filename) => `${import.meta.env.BASE_URL}bloom-display/${filename}`;

const BLOOM_ARTWORK_LAYOUTS = [
  {
    src: bloomAssetPath('bloom-0-of-5.png'),
    stageHeight: 214,
    glowTop: '9%',
    glowRight: '-9%',
    glowBottom: '-4%',
    glowLeft: '-9%',
    glowOriginY: '52%',
  },
  {
    src: bloomAssetPath('bloom-1-of-5.png'),
    stageHeight: 214,
    glowTop: '9%',
    glowRight: '-9%',
    glowBottom: '-4%',
    glowLeft: '-9%',
    glowOriginY: '52%',
  },
  {
    src: bloomAssetPath('bloom-2-of-5.png'),
    stageHeight: 232,
    glowTop: '6%',
    glowRight: '-9%',
    glowBottom: '-5%',
    glowLeft: '-9%',
    glowOriginY: '47%',
  },
  {
    src: bloomAssetPath('bloom-3-of-5.png'),
    stageHeight: 232,
    glowTop: '5%',
    glowRight: '-9%',
    glowBottom: '-5%',
    glowLeft: '-9%',
    glowOriginY: '43%',
  },
  {
    src: bloomAssetPath('bloom-4-of-5.png'),
    stageHeight: 232,
    glowTop: '4%',
    glowRight: '-10%',
    glowBottom: '-5%',
    glowLeft: '-10%',
    glowOriginY: '39%',
  },
  {
    src: bloomAssetPath('bloom-full.png'),
    stageHeight: 258,
    glowTop: '2%',
    glowRight: '-10%',
    glowBottom: '-5%',
    glowLeft: '-10%',
    glowOriginY: '34%',
  },
];

const BLOOM_STATES = BLOOM_ARTWORK_LAYOUTS.map((layout) => layout.src);
const FULL_BLOOM_STATE_INDEX = BLOOM_STATES.length - 1;

const EMPTY_GLOW = {
  background: 'var(--glow-empty)',
  opacity: 0.82,
  scale: 0.86,
};

const PROGRESS_GLOWS = [
  {
    background: 'var(--glow-0)',
    opacity: 0.68,
    scale: 0.78,
  },
  {
    background: 'var(--glow-1)',
    opacity: 0.72,
    scale: 0.8,
  },
  {
    background: 'var(--glow-2)',
    opacity: 0.76,
    scale: 0.82,
  },
  {
    background: 'var(--glow-3)',
    opacity: 0.8,
    scale: 0.85,
  },
  {
    background: 'var(--glow-4)',
    opacity: 0.84,
    scale: 0.88,
  },
  {
    background: 'var(--glow-complete)',
    opacity: 0.88,
    scale: 0.9,
  },
];

function normalizeTasks(value) {
  return Array.isArray(value) ? value.filter((task) => task?.text) : [];
}

function readTasks() {
  try {
    const storedValue =
      localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
    const stored = JSON.parse(storedValue || '[]');
    const tasks = normalizeTasks(stored);

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

function clamp(value, min, max) {
  if (!Number.isFinite(value)) return min;
  return Math.min(Math.max(value, min), max);
}

function getCompletedCount(tasks) {
  return normalizeTasks(tasks).filter((task) => task.completed).length;
}

function getBloomStateIndex(completedTasks, totalTasks) {
  const total = Math.max(0, Number(totalTasks) || 0);
  if (total === 0) return FULL_BLOOM_STATE_INDEX;

  const completed = clamp(Number(completedTasks) || 0, 0, total);
  const progress = clamp(completed / total, 0, 1);

  if (progress === 0) return 0;
  if (progress === 1) return FULL_BLOOM_STATE_INDEX;

  const restoringStateCount = BLOOM_STATES.length - 2;
  return clamp(Math.ceil(progress * restoringStateCount), 1, FULL_BLOOM_STATE_INDEX - 1);
}

function getGlowState(completedTasks, totalTasks, bloomStateIndex) {
  if (totalTasks === 0) return EMPTY_GLOW;
  if (completedTasks >= totalTasks) return PROGRESS_GLOWS[FULL_BLOOM_STATE_INDEX];

  return PROGRESS_GLOWS[bloomStateIndex] || PROGRESS_GLOWS[0];
}

function glowLayerStyle(glowState) {
  return {
    '--glow-layer': glowState.background,
    '--glow-layer-opacity': glowState.opacity,
    '--glow-layer-scale': glowState.scale,
  };
}

function artworkLayoutStyle(layout) {
  return {
    '--artwork-stage-height': `${layout.stageHeight}px`,
    '--glow-top': layout.glowTop,
    '--glow-right': layout.glowRight,
    '--glow-bottom': layout.glowBottom,
    '--glow-left': layout.glowLeft,
    '--glow-origin-y': layout.glowOriginY,
  };
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
  const [isAdding, setIsAdding] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  const validTasks = useMemo(() => normalizeTasks(tasks), [tasks]);
  const completedCount = useMemo(() => getCompletedCount(validTasks), [validTasks]);
  const bloomStateIndex = useMemo(
    () => getBloomStateIndex(completedCount, validTasks.length),
    [completedCount, validTasks.length]
  );
  const hasTasks = validTasks.length > 0;
  const artwork = BLOOM_STATES[bloomStateIndex] || BLOOM_STATES[FULL_BLOOM_STATE_INDEX];
  const artworkLayout =
    BLOOM_ARTWORK_LAYOUTS[bloomStateIndex] ||
    BLOOM_ARTWORK_LAYOUTS[FULL_BLOOM_STATE_INDEX];
  const glowState = useMemo(
    () => getGlowState(completedCount, validTasks.length, bloomStateIndex),
    [bloomStateIndex, completedCount, validTasks.length]
  );
  const [activeGlowState, setActiveGlowState] = useState(glowState);
  const [previousGlowState, setPreviousGlowState] = useState(null);

  useEffect(() => {
    BLOOM_STATES.forEach((src) => {
      const image = new Image();
      image.src = src;
    });
  }, []);

  useEffect(() => {
    if (activeGlowState.background === glowState.background) return undefined;

    setPreviousGlowState(activeGlowState);
    setActiveGlowState(glowState);

    const timer = window.setTimeout(() => {
      setPreviousGlowState(null);
    }, 440);

    return () => window.clearTimeout(timer);
  }, [glowState]);

  function commitTasks(nextTasks) {
    const normalizedTasks = normalizeTasks(nextTasks);
    setTasks(normalizedTasks);
    saveTasks(normalizedTasks);
  }

  function addTask(event) {
    event.preventDefault();
    addDraftTask();
  }

  function addDraftTask() {
    const trimmed = draft.trim();
    if (!trimmed) {
      cancelDraftTask();
      return;
    }

    commitTasks([...validTasks, createTask(trimmed)]);
    setDraft('');
    setIsAdding(false);
  }

  function updateTask(id, text) {
    commitTasks(
      tasks.map((task) => (task.id === id ? { ...task, text } : task))
    );
  }

  function beginAddTask() {
    setDraft('');
    setIsAdding(true);
  }

  function cancelDraftTask() {
    setDraft('');
    setIsAdding(false);
  }

  function beginEditTask(task) {
    setEditingTask({
      id: task.id,
      text: task.text,
    });
  }

  function settleEditedTask() {
    if (!editingTask) return;

    const trimmed = editingTask.text.trim();
    if (!trimmed) {
      setEditingTask(null);
      return;
    }

    updateTask(editingTask.id, trimmed);
    setEditingTask(null);
  }

  function cancelEditedTask() {
    setEditingTask(null);
  }

  function toggleTask(id) {
    commitTasks(
      tasks.map((task) =>
        task.id === id ? { ...task, completed: !task.completed } : task
      )
    );
  }

  function resetList() {
    commitTasks([]);
    setDraft('');
    setIsAdding(false);
    setEditingTask(null);
  }

  return (
    <main className="widget" aria-label="Bloom botanical task widget">
      <section className="art-panel" aria-live="polite">
        <DisplayDate />
        <div className="artwork-wrap" style={artworkLayoutStyle(artworkLayout)}>
          <div className="artwork-stage">
            {previousGlowState && (
              <span
                className="artwork-glow previous"
                style={glowLayerStyle(previousGlowState)}
                aria-hidden="true"
              />
            )}
            <span
              className="artwork-glow current"
              key={activeGlowState.background}
              style={glowLayerStyle(activeGlowState)}
              aria-hidden="true"
            />
            <img
              className="botanical-art"
              src={artwork}
              alt={`Botanical illustration showing task progress for ${fullDateLabel()}`}
              onError={(event) => {
                event.currentTarget.onerror = null;
                event.currentTarget.src = BLOOM_STATES[FULL_BLOOM_STATE_INDEX];
              }}
            />
          </div>
        </div>
      </section>

      <section className="task-panel">
        <div className="priority-heading">
          <span className="priority-title">
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
            {validTasks.map((task) => (
              <div className="task-row" key={task.id}>
                <button
                  className={task.completed ? 'check-button checked' : 'check-button'}
                  type="button"
                  onClick={() => toggleTask(task.id)}
                  aria-label={task.completed ? 'Mark incomplete' : 'Mark complete'}
                >
                  <span aria-hidden="true" />
                </button>
                {editingTask?.id === task.id ? (
                  <input
                    autoFocus
                    className={task.completed ? 'task-input editing done' : 'task-input editing'}
                    value={editingTask.text}
                    onChange={(event) =>
                      setEditingTask({ ...editingTask, text: event.target.value })
                    }
                    onBlur={settleEditedTask}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault();
                        settleEditedTask();
                      }

                      if (event.key === 'Escape') {
                        event.preventDefault();
                        cancelEditedTask();
                      }
                    }}
                    aria-label="Edit priority"
                  />
                ) : (
                  <button
                    className={task.completed ? 'task-text done' : 'task-text'}
                    type="button"
                    onClick={() => beginEditTask(task)}
                    aria-label={`Edit priority: ${task.text}`}
                  >
                    {task.text}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {isAdding ? (
          <form className="add-form adding" onSubmit={addTask}>
            <span className="add-space" aria-hidden="true" />
            <input
              autoFocus
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onBlur={addDraftTask}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  addDraftTask();
                }

                if (event.key === 'Escape') {
                  event.preventDefault();
                  cancelDraftTask();
                }
              }}
              placeholder="Type a priority..."
              aria-label="Type a priority"
            />
            <button className="submit-hidden" type="submit" aria-label="Add priority" />
            {!hasTasks && <p className="input-hint">Press Enter to add</p>}
          </form>
        ) : (
          <button className="add-row" type="button" onClick={beginAddTask}>
            <span aria-hidden="true">+</span>
            <span>Add a priority</span>
          </button>
        )}
      </section>
    </main>
  );
}

createRoot(document.getElementById('root')).render(<App />);
