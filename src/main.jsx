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
  { background: 'var(--glow-0)', opacity: 0.68, scale: 0.78 },
  { background: 'var(--glow-1)', opacity: 0.72, scale: 0.8 },
  { background: 'var(--glow-2)', opacity: 0.76, scale: 0.82 },
  { background: 'var(--glow-3)', opacity: 0.8, scale: 0.85 },
  { background: 'var(--glow-4)', opacity: 0.84, scale: 0.88 },
  { background: 'var(--glow-complete)', opacity: 0.88, scale: 0.9 },
];

let tasks = readTasks();
let editingTaskId = null;
let previousGlowState = null;
let previousGlowTimer = null;
let activeGlowState = getGlowState(
  getCompletedCount(tasks),
  normalizeTasks(tasks).length,
  getBloomStateIndex(getCompletedCount(tasks), normalizeTasks(tasks).length)
);

function normalizeTasks(value) {
  return Array.isArray(value) ? value.filter((task) => task?.text) : [];
}

function readTasks() {
  try {
    const storedValue =
      getStoredValue(STORAGE_KEY) || getStoredValue(LEGACY_STORAGE_KEY);
    const stored = JSON.parse(storedValue || '[]');
    const normalizedTasks = normalizeTasks(stored);

    if (!getStoredValue(STORAGE_KEY) && normalizedTasks.length > 0) {
      saveTasks(normalizedTasks);
    }

    return normalizedTasks;
  } catch {
    return [];
  }
}

function saveTasks(nextTasks) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextTasks));
  } catch {
    // Notion can restrict storage; the current page state still remains usable.
  }
}

function getStoredValue(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function createTask(text) {
  return {
    id:
      crypto?.randomUUID?.() ||
      `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    text: text.trim(),
    completed: false,
  };
}

function clamp(value, min, max) {
  if (!Number.isFinite(value)) return min;
  return Math.min(Math.max(value, min), max);
}

function getCompletedCount(value) {
  return normalizeTasks(value).filter((task) => task.completed).length;
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

function formatToday() {
  const now = new Date();

  return {
    weekday: new Intl.DateTimeFormat(undefined, { weekday: 'long' }).format(now),
    date: new Intl.DateTimeFormat(undefined, { month: 'long', day: 'numeric' }).format(now),
    full: new Intl.DateTimeFormat(undefined, {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    }).format(now),
  };
}

function escapeHTML(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function styleVars(values) {
  return Object.entries(values)
    .map(([key, value]) => `${key}: ${value}`)
    .join('; ');
}

function glowLayerStyle(glowState) {
  return styleVars({
    '--glow-layer': glowState.background,
    '--glow-layer-opacity': glowState.opacity,
    '--glow-layer-scale': glowState.scale,
  });
}

function artworkLayoutStyle(layout) {
  return styleVars({
    '--artwork-stage-height': `${layout.stageHeight}px`,
    '--glow-top': layout.glowTop,
    '--glow-right': layout.glowRight,
    '--glow-bottom': layout.glowBottom,
    '--glow-left': layout.glowLeft,
    '--glow-origin-y': layout.glowOriginY,
  });
}

function commitTasks(nextTasks) {
  tasks = normalizeTasks(nextTasks);
  saveTasks(tasks);
  render();
}

function addTaskFromInput(input) {
  const text = input.value.trim();
  if (!text) return;

  input.value = '';
  commitTasks([...tasks, createTask(text)]);
  requestAnimationFrame(() => {
    const nextInput = document.querySelector('[data-add-input]');
    if (nextInput) {
      nextInput.focus({ preventScroll: true });
    }
  });
}

function updateTask(id, text) {
  const trimmed = text.trim();
  if (!trimmed) {
    editingTaskId = null;
    removeTask(id);
    return;
  }

  commitTasks(tasks.map((task) => (task.id === id ? { ...task, text: trimmed } : task)));
  editingTaskId = null;
}

function removeTask(id) {
  if (editingTaskId === id) {
    editingTaskId = null;
  }

  commitTasks(tasks.filter((task) => task.id !== id));
}

function toggleTask(id) {
  commitTasks(
    tasks.map((task) =>
      task.id === id ? { ...task, completed: !task.completed } : task
    )
  );
}

function resetList() {
  tasks = [];
  editingTaskId = null;
  saveTasks(tasks);
  render();
}

function renderTasks(validTasks) {
  if (validTasks.length === 0) return '';

  return `
    <div class="task-list" aria-label="Today priorities">
      ${validTasks
        .map((task) => {
          const text = escapeHTML(task.text);
          const checkedClass = task.completed ? 'check-button checked' : 'check-button';
          const textClass = task.completed ? 'task-text done' : 'task-text';

          if (editingTaskId === task.id) {
            return `
              <div class="task-row" data-task-id="${task.id}">
                <button class="${checkedClass}" type="button" data-toggle-task="${task.id}" aria-label="${task.completed ? 'Mark incomplete' : 'Mark complete'}">
                  <span aria-hidden="true"></span>
                </button>
                <input class="${task.completed ? 'task-input editing done' : 'task-input editing'}" value="${text}" data-edit-input="${task.id}" aria-label="Edit priority" />
              </div>
            `;
          }

          return `
            <div class="task-row" data-task-id="${task.id}">
              <button class="${checkedClass}" type="button" data-toggle-task="${task.id}" aria-label="${task.completed ? 'Mark incomplete' : 'Mark complete'}">
                <span aria-hidden="true"></span>
              </button>
              <button class="${textClass}" type="button" data-edit-task="${task.id}" aria-label="Edit priority: ${text}">
                ${text}
              </button>
            </div>
          `;
        })
        .join('')}
    </div>
  `;
}

function render() {
  const validTasks = normalizeTasks(tasks);
  const completedCount = getCompletedCount(validTasks);
  const bloomStateIndex = getBloomStateIndex(completedCount, validTasks.length);
  const artwork = BLOOM_STATES[bloomStateIndex] || BLOOM_STATES[FULL_BLOOM_STATE_INDEX];
  const artworkLayout =
    BLOOM_ARTWORK_LAYOUTS[bloomStateIndex] ||
    BLOOM_ARTWORK_LAYOUTS[FULL_BLOOM_STATE_INDEX];
  const glowState = getGlowState(completedCount, validTasks.length, bloomStateIndex);

  if (activeGlowState.background !== glowState.background) {
    previousGlowState = activeGlowState;
    activeGlowState = glowState;
    window.clearTimeout(previousGlowTimer);
    previousGlowTimer = window.setTimeout(() => {
      previousGlowState = null;
      render();
    }, 440);
  }

  const today = formatToday();
  const root = document.getElementById('root');

  root.innerHTML = `
    <main class="widget" aria-label="Bloom botanical task widget">
      <section class="art-panel" aria-live="polite">
        <header class="date-stack">
          <p class="weekday">${escapeHTML(today.weekday)}</p>
          <p class="date-line">${escapeHTML(today.date)}</p>
        </header>
        <div class="artwork-wrap" style="${artworkLayoutStyle(artworkLayout)}">
          <div class="artwork-stage">
            ${
              previousGlowState
                ? `<span class="artwork-glow previous" style="${glowLayerStyle(previousGlowState)}" aria-hidden="true"></span>`
                : ''
            }
            <span class="artwork-glow current" style="${glowLayerStyle(activeGlowState)}" aria-hidden="true"></span>
            <img class="botanical-art" src="${artwork}" alt="Botanical illustration showing task progress for ${escapeHTML(today.full)}" />
          </div>
        </div>
      </section>

      <section class="task-panel">
        <div class="priority-heading">
          <span class="priority-title">
            <h1>Priorities</h1>
          </span>
          ${
            validTasks.length > 0
              ? '<button class="reset-button" type="button" data-reset-list aria-label="Reset list">↺</button>'
              : ''
          }
        </div>

        ${renderTasks(validTasks)}

        <label class="add-form">
          <span class="add-space" aria-hidden="true">+</span>
          <input data-add-input placeholder="Add a priority" aria-label="Add a priority" />
        </label>
      </section>
    </main>
  `;

  bindEvents(root);

  const editingInput = root.querySelector('[data-edit-input]');
  if (editingInput) {
    editingInput.focus({ preventScroll: true });
    editingInput.setSelectionRange(editingInput.value.length, editingInput.value.length);
  }
}

function bindEvents(root) {
  root.querySelector('[data-add-input]')?.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      addTaskFromInput(event.currentTarget);
    }
  });

  root.querySelector('[data-add-input]')?.addEventListener('blur', (event) => {
    addTaskFromInput(event.currentTarget);
  });

  root.querySelectorAll('[data-toggle-task]').forEach((button) => {
    button.addEventListener('click', () => toggleTask(button.dataset.toggleTask));
  });

  root.querySelectorAll('[data-edit-task]').forEach((button) => {
    button.addEventListener('click', () => {
      editingTaskId = button.dataset.editTask;
      render();
    });

    button.addEventListener('keydown', (event) => {
      if (event.key === 'Backspace' || event.key === 'Delete') {
        event.preventDefault();
        removeTask(button.dataset.editTask);
      }
    });
  });

  root.querySelectorAll('[data-edit-input]').forEach((input) => {
    input.addEventListener('keydown', (event) => {
      if (
        (event.key === 'Backspace' || event.key === 'Delete') &&
        input.value.trim() === ''
      ) {
        event.preventDefault();
        removeTask(input.dataset.editInput);
        return;
      }

      if (event.key === 'Enter') {
        event.preventDefault();
        updateTask(input.dataset.editInput, input.value);
      }

      if (event.key === 'Escape') {
        event.preventDefault();
        editingTaskId = null;
        render();
      }
    });

    input.addEventListener('blur', () => updateTask(input.dataset.editInput, input.value));
  });

  root.querySelector('[data-reset-list]')?.addEventListener('click', resetList);
}

BLOOM_STATES.forEach((src) => {
  const image = new Image();
  image.src = src;
});

render();
