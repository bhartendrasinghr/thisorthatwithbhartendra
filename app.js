// =============== Life Tracker ===============
// Client-side only. Data persists in localStorage.
// Hierarchy: Area > Project > Task. Each entity has an update log.
// Separate To-Dos section for quick captures.

const LS_KEY = 'life-tracker:v1';
const LS_PASS = 'life-tracker:passhash:v1';
const LS_THEME = 'life-tracker:theme';

const state = {
  data: null,
  view: { name: 'dashboard' }, // {name, areaId?, projectId?, taskId?}
};

// ---------- Persistence ----------
function emptyData() {
  return { areas: [], projects: [], tasks: [], updates: [], todos: [] };
}
function load() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    state.data = raw ? JSON.parse(raw) : emptyData();
    for (const k of ['areas','projects','tasks','updates','todos']) {
      if (!Array.isArray(state.data[k])) state.data[k] = [];
    }
    // Migration: ensure tasks have priority + dueDate
    for (const t of state.data.tasks) {
      if (!('priority' in t)) t.priority = 'med';
      if (!('dueDate' in t)) t.dueDate = null;
    }
  } catch (e) {
    state.data = emptyData();
  }
}
function save() {
  localStorage.setItem(LS_KEY, JSON.stringify(state.data));
}

// ---------- Utilities ----------
const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
const now = () => new Date().toISOString();
const fmt = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
};
const fmtDate = (iso) => {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString(undefined, { dateStyle: 'medium' });
};

// Date helpers for due dates (stored as YYYY-MM-DD)
function todayYMD() {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
}
function daysUntil(ymd) {
  if (!ymd) return null;
  const t = new Date(todayYMD() + 'T00:00:00');
  const d = new Date(ymd + 'T00:00:00');
  return Math.round((d - t) / 86400000);
}
function dueRelative(ymd) {
  const n = daysUntil(ymd);
  if (n === null) return '';
  if (n === 0) return 'Due today';
  if (n === 1) return 'Due tomorrow';
  if (n === -1) return 'Overdue 1 day';
  if (n < -1) return 'Overdue ' + Math.abs(n) + ' days';
  if (n <= 7) return 'Due in ' + n + ' days';
  return 'Due ' + new Date(ymd + 'T00:00:00').toLocaleDateString(undefined, { dateStyle: 'medium' });
}
function dueClass(t) {
  if (!t.dueDate || t.status === 'done') return '';
  const n = daysUntil(t.dueDate);
  if (n < 0) return 'overdue';
  if (n <= 2) return 'due-soon';
  return '';
}

function el(tag, attrs = {}, ...children) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') e.className = v;
    else if (k === 'html') e.innerHTML = v;
    else if (k.startsWith('on') && typeof v === 'function') e.addEventListener(k.slice(2), v);
    else if (v !== false && v != null) e.setAttribute(k, v);
  }
  for (const c of children.flat()) {
    if (c == null || c === false) continue;
    e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
  }
  return e;
}

async function sha256(text) {
  const buf = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest('SHA-256', buf);
  return [...new Uint8Array(hash)].map(b => b.toString(16).padStart(2, '0')).join('');
}

// ---------- Icons (inline SVG) ----------
const ICONS = {
  dashboard: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/></svg>',
  grid: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>',
  log: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="15" y2="17"/></svg>',
};
function injectIcons() {
  document.querySelectorAll('[data-icon]').forEach(el => {
    const name = el.dataset.icon;
    if (ICONS[name]) el.innerHTML = ICONS[name];
  });
}

// ---------- Theme ----------
function getTheme() {
  return localStorage.getItem(LS_THEME) || 'dark';
}
function setTheme(t) {
  document.documentElement.setAttribute('data-theme', t);
  localStorage.setItem(LS_THEME, t);
}
function toggleTheme() {
  setTheme(getTheme() === 'dark' ? 'light' : 'dark');
  toast('Theme: ' + getTheme());
}

// ---------- Toast ----------
let toastTimer;
function toast(msg, kind) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast' + (kind ? ' ' + kind : '');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.add('hidden'), 2400);
}

// ---------- CRUD helpers ----------
function getArea(id) { return state.data.areas.find(a => a.id === id); }
function getProject(id) { return state.data.projects.find(p => p.id === id); }
function getTask(id) { return state.data.tasks.find(t => t.id === id); }

function projectsOfArea(areaId) { return state.data.projects.filter(p => p.areaId === areaId); }
function tasksOfProject(projectId) { return state.data.tasks.filter(t => t.projectId === projectId); }
function updatesForEntity(type, id) {
  return state.data.updates
    .filter(u => u.entityType === type && u.entityId === id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

function addArea({ name, description }) {
  const a = { id: uid(), name, description: description || '', createdAt: now() };
  state.data.areas.push(a);
  logUpdate('area', a.id, 'Created area "' + a.name + '"');
  save(); return a;
}
function addProject({ areaId, name, description }) {
  const p = { id: uid(), areaId, name, description: description || '', createdAt: now() };
  state.data.projects.push(p);
  logUpdate('project', p.id, 'Created project "' + p.name + '"');
  save(); return p;
}
function addTask({ projectId, title, description, dueDate, priority }) {
  const t = {
    id: uid(), projectId, title,
    description: description || '',
    status: 'todo',
    priority: priority || 'med',
    dueDate: dueDate || null,
    createdAt: now(),
    completedAt: null,
  };
  state.data.tasks.push(t);
  logUpdate('task', t.id, 'Created task "' + t.title + '"');
  save(); return t;
}
function toggleTask(taskId) {
  const t = getTask(taskId);
  if (!t) return;
  if (t.status === 'done') { t.status = 'todo'; t.completedAt = null; logUpdate('task', t.id, 'Reopened'); }
  else { t.status = 'done'; t.completedAt = now(); logUpdate('task', t.id, 'Marked done'); }
  save();
}
function logUpdate(entityType, entityId, text) {
  state.data.updates.push({ id: uid(), entityType, entityId, text, createdAt: now() });
  save();
}
function deleteEntity(type, id) {
  if (type === 'area') {
    const projects = projectsOfArea(id);
    for (const p of projects) deleteEntity('project', p.id);
    state.data.areas = state.data.areas.filter(a => a.id !== id);
  } else if (type === 'project') {
    const tasks = tasksOfProject(id);
    for (const t of tasks) deleteEntity('task', t.id);
    state.data.projects = state.data.projects.filter(p => p.id !== id);
  } else if (type === 'task') {
    state.data.tasks = state.data.tasks.filter(t => t.id !== id);
  } else if (type === 'todo') {
    state.data.todos = state.data.todos.filter(t => t.id !== id);
  }
  state.data.updates = state.data.updates.filter(u => !(u.entityType === type && u.entityId === id));
  save();
}

function addTodo({ title }) {
  const t = { id: uid(), title, done: false, createdAt: now(), completedAt: null };
  state.data.todos.push(t);
  save(); return t;
}
function toggleTodo(id) {
  const t = state.data.todos.find(x => x.id === id);
  if (!t) return;
  t.done = !t.done;
  t.completedAt = t.done ? now() : null;
  save();
}

// ---------- Stats ----------
function statsForTasks(tasks) {
  const total = tasks.length;
  const done = tasks.filter(t => t.status === 'done').length;
  const pct = total ? Math.round((done / total) * 100) : 0;
  const open = tasks.filter(t => t.status !== 'done');
  const overdue = open.filter(t => {
    const n = daysUntil(t.dueDate);
    return n !== null && n < 0;
  }).length;
  const dueSoon = open.filter(t => {
    const n = daysUntil(t.dueDate);
    return n !== null && n >= 0 && n <= 7;
  }).length;
  return { total, done, open: total - done, pct, overdue, dueSoon };
}

// Sort tasks: overdue → due-soon → due-later → no-due, then by priority, then created
const PRIO_RANK = { high: 0, med: 1, low: 2 };
function sortTasks(tasks) {
  return [...tasks].sort((a, b) => {
    if ((a.status === 'done') !== (b.status === 'done')) return a.status === 'done' ? 1 : -1;
    const da = daysUntil(a.dueDate);
    const db = daysUntil(b.dueDate);
    if (da === null && db === null) {/* fall through */}
    else if (da === null) return 1;
    else if (db === null) return -1;
    else if (da !== db) return da - db;
    const pa = PRIO_RANK[a.priority || 'med'] ?? 1;
    const pb = PRIO_RANK[b.priority || 'med'] ?? 1;
    if (pa !== pb) return pa - pb;
    return a.createdAt.localeCompare(b.createdAt);
  });
}

// ---------- Lock screen ----------
const lockEl = () => document.getElementById('lock');
const appEl = () => document.getElementById('app');
const lockInput = () => document.getElementById('lock-input');
const lockConfirm = () => document.getElementById('lock-input-confirm');
const lockError = () => document.getElementById('lock-error');
const lockMsg = () => document.getElementById('lock-msg');

async function initLock() {
  lockEl().classList.remove('hidden');
  appEl().classList.add('hidden');
  const stored = localStorage.getItem(LS_PASS);
  if (!stored) {
    lockMsg().textContent = 'Set a passcode to secure this tracker';
    lockConfirm().classList.remove('hidden');
    document.getElementById('lock-submit').textContent = 'Set passcode';
  } else {
    lockMsg().textContent = 'Enter your passcode';
    lockConfirm().classList.add('hidden');
    document.getElementById('lock-submit').textContent = 'Unlock';
  }
  lockInput().value = '';
  lockConfirm().value = '';
  lockError().classList.add('hidden');
  setTimeout(() => lockInput().focus(), 50);
}

async function handleLockSubmit() {
  const stored = localStorage.getItem(LS_PASS);
  const pw = lockInput().value;
  const err = lockError();
  err.classList.add('hidden');
  if (!pw) { err.textContent = 'Passcode required'; err.classList.remove('hidden'); return; }
  if (!stored) {
    const pw2 = lockConfirm().value;
    if (pw.length < 4) { err.textContent = 'Use at least 4 characters'; err.classList.remove('hidden'); return; }
    if (pw !== pw2) { err.textContent = 'Passcodes do not match'; err.classList.remove('hidden'); return; }
    localStorage.setItem(LS_PASS, await sha256(pw));
    unlock();
  } else {
    if (await sha256(pw) !== stored) {
      err.textContent = 'Wrong passcode'; err.classList.remove('hidden'); return;
    }
    unlock();
  }
}
function unlock() {
  lockEl().classList.add('hidden');
  appEl().classList.remove('hidden');
  injectIcons();
  render();
}
function lockNow() {
  appEl().classList.add('hidden');
  initLock();
}

// ---------- Modal ----------
function openModal(title, bodyNode) {
  document.getElementById('modal-title').textContent = title;
  const body = document.getElementById('modal-body');
  body.innerHTML = '';
  body.appendChild(bodyNode);
  document.getElementById('modal').classList.remove('hidden');
}
function closeModal() { document.getElementById('modal').classList.add('hidden'); }

// ---------- Forms ----------
function formAddArea() {
  const name = el('input', { placeholder: 'e.g. Health, Career, Finance' });
  const desc = el('textarea', { placeholder: 'Optional description' });
  const submit = el('button', { onclick: () => {
    if (!name.value.trim()) return;
    addArea({ name: name.value.trim(), description: desc.value.trim() });
    toast('Area added', 'ok');
    closeModal(); render();
  } }, 'Add area');
  return el('div', {},
    el('label', {}, 'Area name'), name,
    el('label', {}, 'Description'), desc,
    el('div', { class: 'modal-actions' },
      el('button', { class: 'ghost', onclick: closeModal }, 'Cancel'),
      submit));
}

function formAddProject(areaId) {
  const areaSel = el('select', {});
  for (const a of state.data.areas) {
    const opt = el('option', { value: a.id }, a.name);
    if (a.id === areaId) opt.selected = true;
    areaSel.appendChild(opt);
  }
  const name = el('input', { placeholder: 'e.g. Run a half marathon' });
  const desc = el('textarea', { placeholder: 'Optional description' });
  const submit = el('button', { onclick: () => {
    if (!name.value.trim() || !areaSel.value) return;
    addProject({ areaId: areaSel.value, name: name.value.trim(), description: desc.value.trim() });
    toast('Project added', 'ok');
    closeModal(); render();
  } }, 'Add project');
  return el('div', {},
    el('label', {}, 'Area'), areaSel,
    el('label', {}, 'Project name'), name,
    el('label', {}, 'Description'), desc,
    el('div', { class: 'modal-actions' },
      el('button', { class: 'ghost', onclick: closeModal }, 'Cancel'),
      submit));
}

function formAddTask(projectId) {
  const projSel = el('select', {});
  for (const p of state.data.projects) {
    const a = getArea(p.areaId);
    const opt = el('option', { value: p.id }, (a ? a.name + ' — ' : '') + p.name);
    if (p.id === projectId) opt.selected = true;
    projSel.appendChild(opt);
  }
  const title = el('input', { placeholder: 'What needs to be done?' });
  const desc = el('textarea', { placeholder: 'Optional notes' });
  const due = el('input', { type: 'date' });
  const prio = el('select', {},
    el('option', { value: 'low' }, 'Low'),
    el('option', { value: 'med', selected: true }, 'Medium'),
    el('option', { value: 'high' }, 'High'));
  const submit = el('button', { onclick: () => {
    if (!title.value.trim() || !projSel.value) return;
    addTask({
      projectId: projSel.value,
      title: title.value.trim(),
      description: desc.value.trim(),
      dueDate: due.value || null,
      priority: prio.value || 'med',
    });
    toast('Task added', 'ok');
    closeModal(); render();
  } }, 'Add task');
  return el('div', {},
    el('label', {}, 'Project'), projSel,
    el('label', {}, 'Task title'), title,
    el('label', {}, 'Description'), desc,
    el('div', { class: 'field-row' },
      el('div', {}, el('label', {}, 'Due date'), due),
      el('div', {}, el('label', {}, 'Priority'), prio)),
    el('div', { class: 'modal-actions' },
      el('button', { class: 'ghost', onclick: closeModal }, 'Cancel'),
      submit));
}

function formAddUpdate(type, id) {
  const text = el('textarea', { placeholder: 'What progress, blocker, or note?' });
  const submit = el('button', { onclick: () => {
    if (!text.value.trim()) return;
    logUpdate(type, id, text.value.trim());
    toast('Update added', 'ok');
    closeModal(); render();
  } }, 'Add update');
  return el('div', {},
    el('label', {}, 'Update'), text,
    el('div', { class: 'modal-actions' },
      el('button', { class: 'ghost', onclick: closeModal }, 'Cancel'),
      submit));
}

function formAddTodo() {
  const title = el('input', { placeholder: 'Quick to-do' });
  const submit = el('button', { onclick: () => {
    if (!title.value.trim()) return;
    addTodo({ title: title.value.trim() });
    toast('To-do added', 'ok');
    closeModal(); render();
  } }, 'Add to-do');
  return el('div', {},
    el('label', {}, 'To-do'), title,
    el('div', { class: 'modal-actions' },
      el('button', { class: 'ghost', onclick: closeModal }, 'Cancel'),
      submit));
}

// ---------- Renderers ----------
function setView(view) {
  state.view = view;
  document.querySelectorAll('.nav-item').forEach(b => {
    b.classList.toggle('active', b.dataset.view === view.name
      || (view.name === 'area' && b.dataset.view === 'areas')
      || (view.name === 'project' && b.dataset.view === 'areas')
      || (view.name === 'task' && b.dataset.view === 'areas'));
  });
  render();
}

function render() {
  const main = document.getElementById('main');
  main.innerHTML = '';
  const v = state.view;
  if (v.name === 'dashboard') renderDashboard(main);
  else if (v.name === 'areas') renderAreas(main);
  else if (v.name === 'area') renderArea(main, v.areaId);
  else if (v.name === 'project') renderProject(main, v.projectId);
  else if (v.name === 'task') renderTask(main, v.taskId);
  else if (v.name === 'todos') renderTodos(main);
  else if (v.name === 'updates') renderUpdates(main);
}

function renderDashboard(root) {
  const allTasks = state.data.tasks;
  const s = statsForTasks(allTasks);
  const openTodos = state.data.todos.filter(t => !t.done).length;

  root.appendChild(el('div', { class: 'page-header' },
    el('h2', {}, 'Dashboard'),
    el('div', { class: 'actions' },
      el('button', { class: 'ghost', onclick: () => openModal('Quick capture', formAddTodo()) }, '+ To-Do'),
      el('button', { onclick: () => openModal('New area', formAddArea()) }, '+ Area'),
    )
  ));

  root.appendChild(el('div', { class: 'stat-grid' },
    stat('Areas', state.data.areas.length),
    stat('Projects', state.data.projects.length),
    stat('Tasks', s.total, s.done + ' done · ' + s.open + ' open'),
    stat('Completion', s.pct + '%', s.done + ' of ' + s.total),
    stat('Overdue', s.overdue, null, s.overdue > 0 ? 'alert' : ''),
    stat('Due in 7 days', s.dueSoon, null, s.dueSoon > 0 ? 'warn' : ''),
    stat('Open To-Dos', openTodos),
  ));

  // Overdue and due-soon list across all projects
  const open = allTasks.filter(t => t.status !== 'done' && t.dueDate);
  const upcoming = sortTasks(open).filter(t => {
    const n = daysUntil(t.dueDate);
    return n !== null && n <= 7;
  }).slice(0, 8);
  if (upcoming.length > 0) {
    root.appendChild(el('div', { class: 'section' },
      el('h3', {}, 'Due now / soon'),
      el('div', {}, ...upcoming.map(t => taskRow(t, true)))
    ));
  }

  // Areas overview
  root.appendChild(el('div', { class: 'section' },
    el('h3', {}, 'Areas'),
    state.data.areas.length === 0
      ? emptyBox('No areas yet.',
          el('button', { class: 'sm', onclick: () => openModal('New area', formAddArea()) }, '+ Add area'))
      : el('div', { class: 'grid' },
          ...state.data.areas.map(a => areaCard(a)))
  ));

  // Recent updates
  const recent = [...state.data.updates].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 8);
  root.appendChild(el('div', { class: 'section' },
    el('h3', {}, 'Recent updates'),
    recent.length === 0
      ? emptyBox('No updates yet.')
      : el('div', {}, ...recent.map(u => updateRow(u, true)))
  ));
}

function emptyBox(msg, ...actions) {
  return el('div', { class: 'empty' },
    el('div', { class: 'empty-icon' }, '·'),
    el('div', {}, msg),
    actions.length ? el('div', { style: 'margin-top:10px' }, ...actions) : null
  );
}

function stat(label, value, sub, kind) {
  return el('div', { class: 'stat' + (kind ? ' ' + kind : '') },
    el('div', { class: 'label' }, label),
    el('div', { class: 'value' }, String(value)),
    sub ? el('div', { class: 'sub' }, sub) : null
  );
}

function areaCard(a) {
  const projects = projectsOfArea(a.id);
  const tasks = projects.flatMap(p => tasksOfProject(p.id));
  const s = statsForTasks(tasks);
  return el('div', { class: 'card clickable', onclick: () => setView({ name: 'area', areaId: a.id }) },
    el('h3', {}, a.name),
    el('div', { class: 'meta' }, projects.length + ' projects · ' + s.total + ' tasks · ' + s.pct + '% done'),
    el('div', { class: 'progress' }, el('span', { style: 'width:' + s.pct + '%' })),
    s.overdue > 0 ? el('div', { class: 'meta', style: 'margin-top:8px; color: var(--danger)' }, s.overdue + ' overdue') : null,
    a.description ? el('div', { class: 'meta', style: 'margin-top:8px' }, a.description) : null
  );
}

function renderAreas(root) {
  root.appendChild(el('div', { class: 'page-header' },
    el('h2', {}, 'Areas'),
    el('div', { class: 'actions' },
      el('button', { onclick: () => openModal('New area', formAddArea()) }, '+ Area'))
  ));
  if (state.data.areas.length === 0) {
    root.appendChild(emptyBox('No areas yet. Add one to get started.',
      el('button', { class: 'sm', onclick: () => openModal('New area', formAddArea()) }, '+ Add area')));
    return;
  }
  root.appendChild(el('div', { class: 'grid' }, ...state.data.areas.map(a => areaCard(a))));
}

function renderArea(root, areaId) {
  const a = getArea(areaId);
  if (!a) { setView({ name: 'areas' }); return; }
  const projects = projectsOfArea(a.id);
  const tasks = projects.flatMap(p => tasksOfProject(p.id));
  const s = statsForTasks(tasks);

  root.appendChild(el('div', { class: 'crumbs' },
    el('a', { onclick: () => setView({ name: 'dashboard' }) }, 'Dashboard'),
    el('span', { class: 'sep' }, '›'),
    el('a', { onclick: () => setView({ name: 'areas' }) }, 'Areas'),
    el('span', { class: 'sep' }, '›'), a.name));

  root.appendChild(el('div', { class: 'page-header' },
    el('h2', {}, a.name),
    el('div', { class: 'actions' },
      el('button', { class: 'ghost', onclick: () => openModal('Add update', formAddUpdate('area', a.id)) }, '+ Update'),
      el('button', { onclick: () => openModal('New project', formAddProject(a.id)) }, '+ Project'),
      el('button', { class: 'ghost danger', onclick: () => confirmDelete('area', a.id, a.name) }, 'Delete'))
  ));

  if (a.description) root.appendChild(el('div', { class: 'card', style: 'margin-bottom:14px' }, a.description));

  root.appendChild(el('div', { class: 'stat-grid' },
    stat('Projects', projects.length),
    stat('Tasks', s.total),
    stat('Done', s.done),
    stat('Completion', s.pct + '%'),
    stat('Overdue', s.overdue, null, s.overdue > 0 ? 'alert' : ''),
  ));

  root.appendChild(el('div', { class: 'section' },
    el('h3', {}, 'Projects'),
    projects.length === 0
      ? emptyBox('No projects yet.')
      : el('div', { class: 'grid' }, ...projects.map(p => projectCard(p)))
  ));

  root.appendChild(el('div', { class: 'section' },
    el('h3', {}, 'Update log'),
    renderUpdateList('area', a.id)
  ));
}

function projectCard(p) {
  const tasks = tasksOfProject(p.id);
  const s = statsForTasks(tasks);
  return el('div', { class: 'card clickable', onclick: () => setView({ name: 'project', projectId: p.id }) },
    el('h3', {}, p.name),
    el('div', { class: 'meta' }, s.total + ' tasks · ' + s.pct + '% done'),
    el('div', { class: 'progress' }, el('span', { style: 'width:' + s.pct + '%' })),
    s.overdue > 0 ? el('div', { class: 'meta', style: 'margin-top:8px; color: var(--danger)' }, s.overdue + ' overdue') : null,
    p.description ? el('div', { class: 'meta', style: 'margin-top:8px' }, p.description) : null
  );
}

function renderProject(root, projectId) {
  const p = getProject(projectId);
  if (!p) { setView({ name: 'areas' }); return; }
  const a = getArea(p.areaId);
  const tasks = sortTasks(tasksOfProject(p.id));
  const s = statsForTasks(tasks);

  root.appendChild(el('div', { class: 'crumbs' },
    el('a', { onclick: () => setView({ name: 'dashboard' }) }, 'Dashboard'),
    el('span', { class: 'sep' }, '›'),
    el('a', { onclick: () => setView({ name: 'areas' }) }, 'Areas'),
    el('span', { class: 'sep' }, '›'),
    a ? el('a', { onclick: () => setView({ name: 'area', areaId: a.id }) }, a.name) : 'Area',
    el('span', { class: 'sep' }, '›'), p.name));

  root.appendChild(el('div', { class: 'page-header' },
    el('h2', {}, p.name),
    el('div', { class: 'actions' },
      el('button', { class: 'ghost', onclick: () => openModal('Add update', formAddUpdate('project', p.id)) }, '+ Update'),
      el('button', { onclick: () => openModal('New task', formAddTask(p.id)) }, '+ Task'),
      el('button', { class: 'ghost danger', onclick: () => confirmDelete('project', p.id, p.name) }, 'Delete'))
  ));

  if (p.description) root.appendChild(el('div', { class: 'card', style: 'margin-bottom:14px' }, p.description));

  root.appendChild(el('div', { class: 'stat-grid' },
    stat('Tasks', s.total),
    stat('Done', s.done),
    stat('Open', s.open),
    stat('Completion', s.pct + '%'),
    stat('Overdue', s.overdue, null, s.overdue > 0 ? 'alert' : ''),
  ));

  root.appendChild(el('div', { class: 'section' },
    el('h3', {}, 'Tasks'),
    tasks.length === 0
      ? emptyBox('No tasks yet.')
      : el('div', {}, ...tasks.map(t => taskRow(t)))
  ));

  root.appendChild(el('div', { class: 'section' },
    el('h3', {}, 'Update log'),
    renderUpdateList('project', p.id)
  ));
}

function taskRow(t, showContext) {
  const cb = el('input', { type: 'checkbox', onchange: () => { toggleTask(t.id); render(); } });
  if (t.status === 'done') cb.checked = true;
  const dueCls = dueClass(t);
  let p = null;
  let a = null;
  if (showContext) {
    p = getProject(t.projectId);
    a = p ? getArea(p.areaId) : null;
  }
  const titleEls = [
    document.createTextNode(t.title),
    t.priority === 'high' ? el('span', { class: 'pill prio-high' }, 'High')
      : t.priority === 'low' ? el('span', { class: 'pill prio-low' }, 'Low')
      : null,
    t.status === 'done'
      ? el('span', { class: 'pill ok' }, 'done')
      : (dueCls === 'overdue' ? el('span', { class: 'pill danger' }, dueRelative(t.dueDate))
        : dueCls === 'due-soon' ? el('span', { class: 'pill warn' }, dueRelative(t.dueDate))
        : t.dueDate ? el('span', { class: 'pill' }, dueRelative(t.dueDate)) : null),
  ].filter(Boolean);
  return el('div', { class: 'task' + (t.status === 'done' ? ' done' : '') + (dueCls ? ' ' + dueCls : '') },
    cb,
    el('div', { class: 'body' },
      el('div', { class: 'title' }, ...titleEls),
      showContext && (a || p)
        ? el('div', { class: 'desc' }, (a ? a.name + ' · ' : '') + (p ? p.name : ''))
        : null,
      t.description ? el('div', { class: 'desc' }, t.description) : null,
      el('div', { class: 'desc' }, 'Created ' + fmtDate(t.createdAt)
        + (t.completedAt ? ' · Done ' + fmtDate(t.completedAt) : ''))
    ),
    el('div', { class: 'actions' },
      el('button', { class: 'ghost sm', onclick: () => setView({ name: 'task', taskId: t.id }) }, 'Open'),
      el('button', { class: 'ghost sm', onclick: () => openModal('Add update', formAddUpdate('task', t.id)) }, '+ Update'),
      el('button', { class: 'ghost sm danger', onclick: () => confirmDelete('task', t.id, t.title) }, 'Delete')
    )
  );
}

function renderTask(root, taskId) {
  const t = getTask(taskId);
  if (!t) { setView({ name: 'areas' }); return; }
  const p = getProject(t.projectId);
  const a = p ? getArea(p.areaId) : null;
  const dueCls = dueClass(t);

  const crumbs = [
    el('a', { onclick: () => setView({ name: 'dashboard' }) }, 'Dashboard'),
    el('span', { class: 'sep' }, '›'),
    el('a', { onclick: () => setView({ name: 'areas' }) }, 'Areas'),
  ];
  if (a) crumbs.push(el('span', { class: 'sep' }, '›'), el('a', { onclick: () => setView({ name: 'area', areaId: a.id }) }, a.name));
  if (p) crumbs.push(el('span', { class: 'sep' }, '›'), el('a', { onclick: () => setView({ name: 'project', projectId: p.id }) }, p.name));
  crumbs.push(el('span', { class: 'sep' }, '›'), document.createTextNode(t.title));
  root.appendChild(el('div', { class: 'crumbs' }, ...crumbs));

  const titleEls = [
    document.createTextNode(t.title),
    t.priority === 'high' ? el('span', { class: 'pill prio-high' }, 'High priority')
      : t.priority === 'low' ? el('span', { class: 'pill prio-low' }, 'Low priority')
      : null,
    t.status === 'done' ? el('span', { class: 'pill ok' }, 'done')
      : (dueCls === 'overdue' ? el('span', { class: 'pill danger' }, dueRelative(t.dueDate))
        : dueCls === 'due-soon' ? el('span', { class: 'pill warn' }, dueRelative(t.dueDate))
        : t.dueDate ? el('span', { class: 'pill' }, dueRelative(t.dueDate)) : el('span', { class: 'pill warn' }, 'open')),
  ].filter(Boolean);

  root.appendChild(el('div', { class: 'page-header' },
    el('h2', {}, ...titleEls),
    el('div', { class: 'actions' },
      el('button', { onclick: () => { toggleTask(t.id); render(); } },
        t.status === 'done' ? 'Reopen' : 'Mark done'),
      el('button', { class: 'ghost', onclick: () => openModal('Add update', formAddUpdate('task', t.id)) }, '+ Update'),
      el('button', { class: 'ghost danger', onclick: () => confirmDelete('task', t.id, t.title) }, 'Delete'))
  ));

  if (t.description) root.appendChild(el('div', { class: 'card', style: 'margin-bottom:14px' }, t.description));

  root.appendChild(el('div', { class: 'card', style: 'margin-bottom:14px' },
    el('div', { class: 'meta' }, 'Created ' + fmt(t.createdAt)),
    t.dueDate ? el('div', { class: 'meta' }, 'Due ' + fmtDate(t.dueDate)) : null,
    t.completedAt ? el('div', { class: 'meta' }, 'Completed ' + fmt(t.completedAt)) : null
  ));

  root.appendChild(el('div', { class: 'section' },
    el('h3', {}, 'Update log'),
    renderUpdateList('task', t.id)
  ));
}

function renderUpdateList(type, id) {
  const ups = updatesForEntity(type, id);
  if (ups.length === 0) return emptyBox('No updates yet.');
  return el('div', {}, ...ups.map(u => updateRow(u, false)));
}

function updateRow(u, showContext) {
  let context = '';
  if (showContext) {
    if (u.entityType === 'area') {
      const a = getArea(u.entityId); context = a ? a.name : 'area';
    } else if (u.entityType === 'project') {
      const p = getProject(u.entityId); context = p ? p.name : 'project';
    } else if (u.entityType === 'task') {
      const t = getTask(u.entityId); context = t ? t.title : 'task';
    }
  }
  return el('div', { class: 'update' },
    el('div', { class: 'when' }, fmt(u.createdAt)),
    el('div', { class: 'what' },
      el('span', { class: 'tag' }, u.entityType),
      showContext && context ? el('span', { class: 'tag' }, context) : null,
      u.text)
  );
}

function renderTodos(root) {
  root.appendChild(el('div', { class: 'page-header' },
    el('h2', {}, 'To-Dos'),
    el('div', { class: 'actions' },
      el('button', { onclick: () => openModal('New to-do', formAddTodo()) }, '+ To-Do'))
  ));
  const todos = [...state.data.todos].sort((a, b) => Number(a.done) - Number(b.done) || b.createdAt.localeCompare(a.createdAt));
  if (todos.length === 0) {
    root.appendChild(emptyBox('No to-dos yet.'));
    return;
  }
  const list = el('div', {});
  for (const td of todos) {
    const cb = el('input', { type: 'checkbox', onchange: () => { toggleTodo(td.id); render(); } });
    if (td.done) cb.checked = true;
    list.appendChild(el('div', { class: 'task' + (td.done ? ' done' : '') },
      cb,
      el('div', { class: 'body' },
        el('div', { class: 'title' }, td.title),
        el('div', { class: 'desc' }, 'Added ' + fmtDate(td.createdAt)
          + (td.completedAt ? ' · Done ' + fmtDate(td.completedAt) : ''))),
      el('div', { class: 'actions' },
        el('button', { class: 'ghost sm danger', onclick: () => { deleteEntity('todo', td.id); render(); } }, 'Delete'))
    ));
  }
  root.appendChild(list);
}

function renderUpdates(root) {
  root.appendChild(el('div', { class: 'page-header' }, el('h2', {}, 'Update Log (all)')));
  const ups = [...state.data.updates].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  if (ups.length === 0) {
    root.appendChild(emptyBox('No updates yet.'));
    return;
  }
  root.appendChild(el('div', {}, ...ups.map(u => updateRow(u, true))));
}

// ---------- Delete confirm ----------
function confirmDelete(type, id, name) {
  const body = el('div', {},
    el('p', {}, 'Delete "' + name + '"? This cannot be undone. Nested items will also be deleted.'),
    el('div', { class: 'modal-actions' },
      el('button', { class: 'ghost', onclick: closeModal }, 'Cancel'),
      el('button', { class: 'ghost danger', onclick: () => {
        deleteEntity(type, id);
        toast(name + ' deleted', 'danger');
        closeModal();
        const v = state.view;
        if ((type === 'area' && v.areaId === id) || (type === 'project' && v.projectId === id) || (type === 'task' && v.taskId === id)) {
          setView({ name: 'areas' });
        } else {
          render();
        }
      } }, 'Delete')));
  openModal('Confirm delete', body);
}

// ---------- Backup / Restore (JSON) ----------
function exportJSON() {
  const payload = {
    schema: 'life-tracker',
    version: 1,
    exportedAt: now(),
    data: state.data,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filenameForView('json', true);
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
  toast('JSON backup downloaded', 'ok');
}

function startImport() {
  document.getElementById('import-file').click();
}

function handleImportFile(e) {
  const file = e.target.files[0];
  e.target.value = '';
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(reader.result);
      const incoming = parsed && parsed.data ? parsed.data : parsed;
      // Validate structure
      const keys = ['areas','projects','tasks','updates','todos'];
      for (const k of keys) {
        if (!Array.isArray(incoming[k])) throw new Error('Missing or invalid "' + k + '" array');
      }
      askImportMode(incoming);
    } catch (err) {
      toast('Import failed: ' + err.message, 'danger');
    }
  };
  reader.onerror = () => toast('Could not read file', 'danger');
  reader.readAsText(file);
}

function askImportMode(incoming) {
  const counts =
    incoming.areas.length + ' areas, ' +
    incoming.projects.length + ' projects, ' +
    incoming.tasks.length + ' tasks, ' +
    incoming.updates.length + ' updates, ' +
    incoming.todos.length + ' to-dos';
  const body = el('div', {},
    el('p', {}, 'Found ' + counts + ' in the backup.'),
    el('p', { class: 'muted small' },
      el('strong', {}, 'Replace'),
      ': delete all current data and load the backup.', el('br'),
      el('strong', {}, 'Merge'),
      ': add backup items alongside current data (duplicate IDs are skipped).'),
    el('div', { class: 'modal-actions' },
      el('button', { class: 'ghost', onclick: closeModal }, 'Cancel'),
      el('button', { class: 'ghost', onclick: () => { mergeImport(incoming); closeModal(); render(); } }, 'Merge'),
      el('button', { class: 'ghost danger', onclick: () => {
        state.data = normalizeImported(incoming);
        save(); closeModal(); render();
        toast('Data replaced from backup', 'ok');
      } }, 'Replace'))
  );
  openModal('Restore from backup', body);
}

function normalizeImported(incoming) {
  const data = {
    areas: incoming.areas.map(x => ({ ...x })),
    projects: incoming.projects.map(x => ({ ...x })),
    tasks: incoming.tasks.map(x => ({ priority: 'med', dueDate: null, ...x })),
    updates: incoming.updates.map(x => ({ ...x })),
    todos: incoming.todos.map(x => ({ ...x })),
  };
  return data;
}

function mergeImport(incoming) {
  const norm = normalizeImported(incoming);
  for (const k of ['areas','projects','tasks','updates','todos']) {
    const existing = new Set(state.data[k].map(x => x.id));
    let added = 0;
    for (const item of norm[k]) {
      if (item.id && !existing.has(item.id)) { state.data[k].push(item); added++; }
    }
  }
  save();
  toast('Backup merged', 'ok');
}

// ---------- Exports (PDF / PPT / XLSX) ----------
async function exportPDF() {
  const main = document.getElementById('main');
  const bg = getComputedStyle(document.body).backgroundColor;
  const canvas = await html2canvas(main, { backgroundColor: bg, scale: 2 });
  const imgData = canvas.toDataURL('image/png');
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const ratio = canvas.width / canvas.height;
  let w = pageW - 40, h = w / ratio;
  if (h > pageH - 40) { h = pageH - 40; w = h * ratio; }
  pdf.addImage(imgData, 'PNG', (pageW - w) / 2, 20, w, h);
  pdf.save(filenameForView('pdf'));
  toast('PDF saved', 'ok');
}

async function exportPPT() {
  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_WIDE';

  const v = state.view;
  const title = pptTitleForView();
  const cover = pptx.addSlide();
  cover.addText(title, { x: 0.5, y: 0.7, w: 12, h: 1, fontSize: 36, bold: true });
  cover.addText('Generated ' + new Date().toLocaleString(), { x: 0.5, y: 1.7, w: 12, h: 0.4, fontSize: 14, color: '888888' });

  if (v.name === 'dashboard') {
    const s = statsForTasks(state.data.tasks);
    const slide = pptx.addSlide();
    slide.addText('Overview', { x: 0.5, y: 0.4, w: 12, h: 0.5, fontSize: 24, bold: true });
    slide.addText([
      { text: 'Areas: ' + state.data.areas.length + '\n' },
      { text: 'Projects: ' + state.data.projects.length + '\n' },
      { text: 'Tasks: ' + s.total + ' (' + s.done + ' done, ' + s.open + ' open)\n' },
      { text: 'Completion: ' + s.pct + '%\n' },
      { text: 'Overdue: ' + s.overdue + ' · Due soon: ' + s.dueSoon + '\n' },
      { text: 'Open To-Dos: ' + state.data.todos.filter(t => !t.done).length },
    ], { x: 0.5, y: 1.0, w: 12, h: 4, fontSize: 18 });

    for (const a of state.data.areas) {
      const projects = projectsOfArea(a.id);
      const tasks = projects.flatMap(p => tasksOfProject(p.id));
      const ast = statsForTasks(tasks);
      const sl = pptx.addSlide();
      sl.addText(a.name, { x: 0.5, y: 0.4, w: 12, h: 0.6, fontSize: 28, bold: true });
      sl.addText(projects.length + ' projects · ' + ast.total + ' tasks · ' + ast.pct + '% done · ' + ast.overdue + ' overdue',
        { x: 0.5, y: 1.0, w: 12, h: 0.4, fontSize: 14, color: '888888' });
      const rows = [['Project', 'Tasks', 'Done', '% complete', 'Overdue']];
      for (const p of projects) {
        const ts = tasksOfProject(p.id);
        const ps = statsForTasks(ts);
        rows.push([p.name, String(ps.total), String(ps.done), ps.pct + '%', String(ps.overdue)]);
      }
      sl.addTable(rows, { x: 0.5, y: 1.5, w: 12, fontSize: 12, border: { type: 'solid', color: 'DDDDDD', pt: 0.5 } });
    }
  } else if (v.name === 'area') {
    const a = getArea(v.areaId);
    if (a) {
      const projects = projectsOfArea(a.id);
      const tasks = projects.flatMap(p => tasksOfProject(p.id));
      const s = statsForTasks(tasks);
      const slide = pptx.addSlide();
      slide.addText(a.name, { x: 0.5, y: 0.4, w: 12, h: 0.6, fontSize: 28, bold: true });
      slide.addText('Projects: ' + projects.length + ' · Tasks: ' + s.total + ' · ' + s.pct + '% done · Overdue: ' + s.overdue,
        { x: 0.5, y: 1.0, w: 12, h: 0.4, fontSize: 14, color: '888888' });
      const rows = [['Project', 'Tasks', 'Done', '% complete', 'Overdue']];
      for (const p of projects) {
        const ts = tasksOfProject(p.id);
        const ps = statsForTasks(ts);
        rows.push([p.name, String(ps.total), String(ps.done), ps.pct + '%', String(ps.overdue)]);
      }
      slide.addTable(rows, { x: 0.5, y: 1.5, w: 12, fontSize: 12, border: { type: 'solid', color: 'DDDDDD', pt: 0.5 } });
      const ups = updatesForEntity('area', a.id).slice(0, 20);
      if (ups.length) {
        const us = pptx.addSlide();
        us.addText('Update log — ' + a.name, { x: 0.5, y: 0.4, w: 12, h: 0.6, fontSize: 22, bold: true });
        const ur = [['When', 'Update']].concat(ups.map(u => [fmt(u.createdAt), u.text]));
        us.addTable(ur, { x: 0.5, y: 1.2, w: 12, fontSize: 11, border: { type: 'solid', color: 'DDDDDD', pt: 0.5 } });
      }
    }
  } else if (v.name === 'project') {
    const p = getProject(v.projectId);
    if (p) {
      const ts = sortTasks(tasksOfProject(p.id));
      const ps = statsForTasks(ts);
      const slide = pptx.addSlide();
      slide.addText(p.name, { x: 0.5, y: 0.4, w: 12, h: 0.6, fontSize: 28, bold: true });
      slide.addText('Tasks: ' + ps.total + ' · ' + ps.pct + '% done · Overdue: ' + ps.overdue,
        { x: 0.5, y: 1.0, w: 12, h: 0.4, fontSize: 14, color: '888888' });
      const rows = [['Task', 'Priority', 'Due', 'Status']];
      for (const t of ts) rows.push([
        t.title, t.priority || 'med',
        t.dueDate ? fmtDate(t.dueDate) : '—',
        t.status,
      ]);
      slide.addTable(rows, { x: 0.5, y: 1.5, w: 12, fontSize: 12, border: { type: 'solid', color: 'DDDDDD', pt: 0.5 } });
      const ups = updatesForEntity('project', p.id).slice(0, 20);
      if (ups.length) {
        const us = pptx.addSlide();
        us.addText('Update log — ' + p.name, { x: 0.5, y: 0.4, w: 12, h: 0.6, fontSize: 22, bold: true });
        const ur = [['When', 'Update']].concat(ups.map(u => [fmt(u.createdAt), u.text]));
        us.addTable(ur, { x: 0.5, y: 1.2, w: 12, fontSize: 11, border: { type: 'solid', color: 'DDDDDD', pt: 0.5 } });
      }
    }
  } else if (v.name === 'task') {
    const t = getTask(v.taskId);
    if (t) {
      const slide = pptx.addSlide();
      slide.addText(t.title, { x: 0.5, y: 0.4, w: 12, h: 0.6, fontSize: 28, bold: true });
      slide.addText('Status: ' + t.status + ' · Priority: ' + (t.priority || 'med')
        + (t.dueDate ? ' · Due ' + fmtDate(t.dueDate) : '')
        + ' · Created ' + fmtDate(t.createdAt)
        + (t.completedAt ? ' · Done ' + fmtDate(t.completedAt) : ''),
        { x: 0.5, y: 1.0, w: 12, h: 0.4, fontSize: 14, color: '888888' });
      if (t.description) slide.addText(t.description, { x: 0.5, y: 1.6, w: 12, h: 1.5, fontSize: 14 });
      const ups = updatesForEntity('task', t.id);
      if (ups.length) {
        const us = pptx.addSlide();
        us.addText('Update log', { x: 0.5, y: 0.4, w: 12, h: 0.6, fontSize: 22, bold: true });
        const ur = [['When', 'Update']].concat(ups.map(u => [fmt(u.createdAt), u.text]));
        us.addTable(ur, { x: 0.5, y: 1.2, w: 12, fontSize: 11, border: { type: 'solid', color: 'DDDDDD', pt: 0.5 } });
      }
    }
  } else if (v.name === 'todos') {
    const slide = pptx.addSlide();
    slide.addText('To-Dos', { x: 0.5, y: 0.4, w: 12, h: 0.6, fontSize: 28, bold: true });
    const rows = [['To-Do', 'Status', 'Added']];
    for (const td of state.data.todos) rows.push([td.title, td.done ? 'done' : 'open', fmtDate(td.createdAt)]);
    slide.addTable(rows, { x: 0.5, y: 1.2, w: 12, fontSize: 12, border: { type: 'solid', color: 'DDDDDD', pt: 0.5 } });
  } else if (v.name === 'updates') {
    const ups = [...state.data.updates].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const slide = pptx.addSlide();
    slide.addText('Update Log', { x: 0.5, y: 0.4, w: 12, h: 0.6, fontSize: 28, bold: true });
    const rows = [['When', 'Type', 'Update']].concat(ups.slice(0, 30).map(u => [fmt(u.createdAt), u.entityType, u.text]));
    slide.addTable(rows, { x: 0.5, y: 1.2, w: 12, fontSize: 11, border: { type: 'solid', color: 'DDDDDD', pt: 0.5 } });
  }

  await pptx.writeFile({ fileName: filenameForView('pptx') });
  toast('PPT saved', 'ok');
}

function exportXLSX() {
  const wb = XLSX.utils.book_new();

  const areas = state.data.areas.map(a => {
    const projects = projectsOfArea(a.id);
    const tasks = projects.flatMap(p => tasksOfProject(p.id));
    const s = statsForTasks(tasks);
    return { id: a.id, name: a.name, description: a.description, projects: projects.length, tasks: s.total, done: s.done, overdue: s.overdue, completion_pct: s.pct, created: a.createdAt };
  });
  const projects = state.data.projects.map(p => {
    const a = getArea(p.areaId);
    const ts = tasksOfProject(p.id);
    const s = statsForTasks(ts);
    return { id: p.id, area: a ? a.name : '', name: p.name, description: p.description, tasks: s.total, done: s.done, overdue: s.overdue, completion_pct: s.pct, created: p.createdAt };
  });
  const tasks = state.data.tasks.map(t => {
    const p = getProject(t.projectId);
    const a = p ? getArea(p.areaId) : null;
    return {
      id: t.id, area: a ? a.name : '', project: p ? p.name : '',
      title: t.title, description: t.description,
      priority: t.priority || 'med',
      due: t.dueDate || '',
      status: t.status,
      created: t.createdAt,
      completed: t.completedAt || '',
    };
  });
  const updates = state.data.updates.map(u => {
    let context = '';
    if (u.entityType === 'area') { const a = getArea(u.entityId); context = a ? a.name : ''; }
    else if (u.entityType === 'project') { const p = getProject(u.entityId); context = p ? p.name : ''; }
    else if (u.entityType === 'task') { const t = getTask(u.entityId); context = t ? t.title : ''; }
    return { when: u.createdAt, type: u.entityType, name: context, update: u.text };
  });
  const todos = state.data.todos.map(t => ({ title: t.title, status: t.done ? 'done' : 'open', created: t.createdAt, completed: t.completedAt || '' }));

  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(areas), 'Areas');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(projects), 'Projects');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(tasks), 'Tasks');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(updates), 'Updates');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(todos), 'ToDos');

  XLSX.writeFile(wb, filenameForView('xlsx', true));
  toast('XLSX saved', 'ok');
}

function pptTitleForView() {
  const v = state.view;
  if (v.name === 'area') { const a = getArea(v.areaId); return a ? 'Area: ' + a.name : 'Area'; }
  if (v.name === 'project') { const p = getProject(v.projectId); return p ? 'Project: ' + p.name : 'Project'; }
  if (v.name === 'task') { const t = getTask(v.taskId); return t ? 'Task: ' + t.title : 'Task'; }
  if (v.name === 'todos') return 'To-Dos';
  if (v.name === 'updates') return 'Update Log';
  if (v.name === 'areas') return 'All Areas';
  return 'Life Tracker — Dashboard';
}

function filenameForView(ext, alwaysFull) {
  const stamp = new Date().toISOString().slice(0, 10);
  let base = 'life-tracker-' + state.view.name;
  if (alwaysFull) base = 'life-tracker-export';
  return base + '-' + stamp + '.' + ext;
}

// ---------- Init ----------
function bind() {
  document.getElementById('lock-submit').addEventListener('click', handleLockSubmit);
  document.getElementById('lock-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      if (!document.getElementById('lock-input-confirm').classList.contains('hidden')) {
        document.getElementById('lock-input-confirm').focus();
      } else handleLockSubmit();
    }
  });
  document.getElementById('lock-input-confirm').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleLockSubmit();
  });
  document.querySelectorAll('.nav-item').forEach(b => {
    b.addEventListener('click', () => setView({ name: b.dataset.view }));
  });
  document.getElementById('modal-close').addEventListener('click', closeModal);
  document.getElementById('modal').addEventListener('click', (e) => {
    if (e.target.id === 'modal') closeModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !document.getElementById('modal').classList.contains('hidden')) closeModal();
  });
  document.getElementById('export-pdf').addEventListener('click', exportPDF);
  document.getElementById('export-ppt').addEventListener('click', exportPPT);
  document.getElementById('export-xlsx').addEventListener('click', exportXLSX);
  document.getElementById('export-json').addEventListener('click', exportJSON);
  document.getElementById('import-json').addEventListener('click', startImport);
  document.getElementById('import-file').addEventListener('change', handleImportFile);
  document.getElementById('theme-toggle').addEventListener('click', toggleTheme);
  document.getElementById('lock-now').addEventListener('click', lockNow);
}

setTheme(getTheme());
load();
bind();
initLock();
