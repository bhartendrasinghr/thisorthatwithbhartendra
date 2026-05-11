// =============== Life Tracker ===============
// Client-side only. Data persists in localStorage.
// Hierarchy: Area > Project > Task. Each entity has an update log.
// Separate To-Dos section for quick captures.

const LS_KEY = 'life-tracker:v1';
const LS_PASS = 'life-tracker:passhash:v1';

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
    // Forward-compat: ensure all keys exist
    for (const k of ['areas','projects','tasks','updates','todos']) {
      if (!Array.isArray(state.data[k])) state.data[k] = [];
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
function addTask({ projectId, title, description }) {
  const t = { id: uid(), projectId, title, description: description || '', status: 'todo', createdAt: now(), completedAt: null };
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
  return { total, done, open: total - done, pct };
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
  const submit = el('button', { onclick: () => {
    if (!title.value.trim() || !projSel.value) return;
    addTask({ projectId: projSel.value, title: title.value.trim(), description: desc.value.trim() });
    closeModal(); render();
  } }, 'Add task');
  return el('div', {},
    el('label', {}, 'Project'), projSel,
    el('label', {}, 'Task title'), title,
    el('label', {}, 'Description'), desc,
    el('div', { class: 'modal-actions' },
      el('button', { class: 'ghost', onclick: closeModal }, 'Cancel'),
      submit));
}

function formAddUpdate(type, id) {
  const text = el('textarea', { placeholder: 'What progress, blocker, or note?' });
  const submit = el('button', { onclick: () => {
    if (!text.value.trim()) return;
    logUpdate(type, id, text.value.trim());
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
    b.classList.toggle('active', b.dataset.view === view.name);
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
    el('div', {},
      el('button', { onclick: () => openModal('Quick capture', formAddTodo()) }, '+ To-Do'),
    )
  ));

  const stats = el('div', { class: 'stat-grid' },
    stat('Areas', state.data.areas.length),
    stat('Projects', state.data.projects.length),
    stat('Tasks', s.total, s.done + ' done / ' + s.open + ' open'),
    stat('Completion', s.pct + '%', s.done + ' of ' + s.total),
    stat('Open To-Dos', openTodos),
  );
  root.appendChild(stats);

  // Areas overview
  root.appendChild(el('div', { class: 'section' },
    el('h3', {}, 'Areas'),
    state.data.areas.length === 0
      ? el('div', { class: 'empty' }, 'No areas yet. ',
          el('button', { class: 'sm', onclick: () => openModal('New area', formAddArea()) }, '+ Add area'))
      : el('div', { class: 'grid' },
          ...state.data.areas.map(a => areaCard(a)))
  ));

  // Recent updates
  const recent = [...state.data.updates].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 8);
  root.appendChild(el('div', { class: 'section' },
    el('h3', {}, 'Recent updates'),
    recent.length === 0
      ? el('div', { class: 'empty' }, 'No updates yet.')
      : el('div', {}, ...recent.map(u => updateRow(u, true)))
  ));
}

function stat(label, value, sub) {
  return el('div', { class: 'stat' },
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
    a.description ? el('div', { class: 'meta', style: 'margin-top:8px' }, a.description) : null
  );
}

function renderAreas(root) {
  root.appendChild(el('div', { class: 'page-header' },
    el('h2', {}, 'Areas'),
    el('div', {},
      el('button', { onclick: () => openModal('New area', formAddArea()) }, '+ Area'))
  ));
  if (state.data.areas.length === 0) {
    root.appendChild(el('div', { class: 'empty' }, 'No areas yet. Add one to get started.'));
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
    ' › ',
    el('a', { onclick: () => setView({ name: 'areas' }) }, 'Areas'),
    ' › ', a.name));

  root.appendChild(el('div', { class: 'page-header' },
    el('h2', {}, a.name),
    el('div', {},
      el('button', { onclick: () => openModal('Add update', formAddUpdate('area', a.id)) }, '+ Update'),
      ' ',
      el('button', { onclick: () => openModal('New project', formAddProject(a.id)) }, '+ Project'),
      ' ',
      el('button', { class: 'ghost danger', onclick: () => confirmDelete('area', a.id, a.name) }, 'Delete'))
  ));

  if (a.description) root.appendChild(el('div', { class: 'card', style: 'margin-bottom:14px' }, a.description));

  root.appendChild(el('div', { class: 'stat-grid' },
    stat('Projects', projects.length),
    stat('Tasks', s.total),
    stat('Done', s.done),
    stat('Completion', s.pct + '%'),
  ));

  root.appendChild(el('div', { class: 'section' },
    el('h3', {}, 'Projects'),
    projects.length === 0
      ? el('div', { class: 'empty' }, 'No projects yet.')
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
    p.description ? el('div', { class: 'meta', style: 'margin-top:8px' }, p.description) : null
  );
}

function renderProject(root, projectId) {
  const p = getProject(projectId);
  if (!p) { setView({ name: 'areas' }); return; }
  const a = getArea(p.areaId);
  const tasks = tasksOfProject(p.id);
  const s = statsForTasks(tasks);

  root.appendChild(el('div', { class: 'crumbs' },
    el('a', { onclick: () => setView({ name: 'dashboard' }) }, 'Dashboard'),
    ' › ',
    el('a', { onclick: () => setView({ name: 'areas' }) }, 'Areas'),
    ' › ',
    a ? el('a', { onclick: () => setView({ name: 'area', areaId: a.id }) }, a.name) : 'Area',
    ' › ', p.name));

  root.appendChild(el('div', { class: 'page-header' },
    el('h2', {}, p.name),
    el('div', {},
      el('button', { onclick: () => openModal('Add update', formAddUpdate('project', p.id)) }, '+ Update'),
      ' ',
      el('button', { onclick: () => openModal('New task', formAddTask(p.id)) }, '+ Task'),
      ' ',
      el('button', { class: 'ghost danger', onclick: () => confirmDelete('project', p.id, p.name) }, 'Delete'))
  ));

  if (p.description) root.appendChild(el('div', { class: 'card', style: 'margin-bottom:14px' }, p.description));

  root.appendChild(el('div', { class: 'stat-grid' },
    stat('Tasks', s.total),
    stat('Done', s.done),
    stat('Open', s.open),
    stat('Completion', s.pct + '%')
  ));

  root.appendChild(el('div', { class: 'section' },
    el('h3', {}, 'Tasks'),
    tasks.length === 0
      ? el('div', { class: 'empty' }, 'No tasks yet.')
      : el('div', {}, ...tasks.map(t => taskRow(t)))
  ));

  root.appendChild(el('div', { class: 'section' },
    el('h3', {}, 'Update log'),
    renderUpdateList('project', p.id)
  ));
}

function taskRow(t) {
  const cb = el('input', { type: 'checkbox', onchange: () => { toggleTask(t.id); render(); } });
  if (t.status === 'done') cb.checked = true;
  return el('div', { class: 'task' + (t.status === 'done' ? ' done' : '') },
    cb,
    el('div', { class: 'body' },
      el('div', { class: 'title' }, t.title,
        t.status === 'done'
          ? el('span', { class: 'pill ok' }, 'done')
          : el('span', { class: 'pill warn' }, 'open')),
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

  root.appendChild(el('div', { class: 'crumbs' },
    el('a', { onclick: () => setView({ name: 'dashboard' }) }, 'Dashboard'),
    ' › ',
    el('a', { onclick: () => setView({ name: 'areas' }) }, 'Areas'),
    a ? [' › ', el('a', { onclick: () => setView({ name: 'area', areaId: a.id }) }, a.name)] : '',
    p ? [' › ', el('a', { onclick: () => setView({ name: 'project', projectId: p.id }) }, p.name)] : '',
    ' › ', t.title));

  root.appendChild(el('div', { class: 'page-header' },
    el('h2', {}, t.title,
      t.status === 'done' ? el('span', { class: 'pill ok' }, 'done')
                          : el('span', { class: 'pill warn' }, 'open')),
    el('div', {},
      el('button', { onclick: () => { toggleTask(t.id); render(); } },
        t.status === 'done' ? 'Reopen' : 'Mark done'),
      ' ',
      el('button', { onclick: () => openModal('Add update', formAddUpdate('task', t.id)) }, '+ Update'),
      ' ',
      el('button', { class: 'ghost danger', onclick: () => confirmDelete('task', t.id, t.title) }, 'Delete'))
  ));

  if (t.description) root.appendChild(el('div', { class: 'card', style: 'margin-bottom:14px' }, t.description));

  root.appendChild(el('div', { class: 'card', style: 'margin-bottom:14px' },
    el('div', { class: 'meta' }, 'Created ' + fmt(t.createdAt)),
    t.completedAt ? el('div', { class: 'meta' }, 'Completed ' + fmt(t.completedAt)) : null
  ));

  root.appendChild(el('div', { class: 'section' },
    el('h3', {}, 'Update log'),
    renderUpdateList('task', t.id)
  ));
}

function renderUpdateList(type, id) {
  const ups = updatesForEntity(type, id);
  if (ups.length === 0) return el('div', { class: 'empty' }, 'No updates yet.');
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
    el('div', {},
      el('button', { onclick: () => openModal('New to-do', formAddTodo()) }, '+ To-Do'))
  ));
  const todos = [...state.data.todos].sort((a, b) => Number(a.done) - Number(b.done) || b.createdAt.localeCompare(a.createdAt));
  if (todos.length === 0) {
    root.appendChild(el('div', { class: 'empty' }, 'No to-dos yet.'));
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
    root.appendChild(el('div', { class: 'empty' }, 'No updates yet.'));
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
        closeModal();
        // Navigate up if we were viewing the deleted entity
        const v = state.view;
        if ((type === 'area' && v.areaId === id) || (type === 'project' && v.projectId === id) || (type === 'task' && v.taskId === id)) {
          setView({ name: 'areas' });
        } else {
          render();
        }
      } }, 'Delete')));
  openModal('Confirm delete', body);
}

// ---------- Exports ----------
async function exportPDF() {
  const main = document.getElementById('main');
  const canvas = await html2canvas(main, { backgroundColor: getComputedStyle(document.body).backgroundColor, scale: 2 });
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
}

async function exportPPT() {
  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_WIDE';

  const v = state.view;
  // Cover slide
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
      { text: 'Open To-Dos: ' + state.data.todos.filter(t => !t.done).length },
    ], { x: 0.5, y: 1.0, w: 12, h: 4, fontSize: 18 });

    for (const a of state.data.areas) {
      const projects = projectsOfArea(a.id);
      const tasks = projects.flatMap(p => tasksOfProject(p.id));
      const ast = statsForTasks(tasks);
      const sl = pptx.addSlide();
      sl.addText(a.name, { x: 0.5, y: 0.4, w: 12, h: 0.6, fontSize: 28, bold: true });
      sl.addText(projects.length + ' projects · ' + ast.total + ' tasks · ' + ast.pct + '% done',
        { x: 0.5, y: 1.0, w: 12, h: 0.4, fontSize: 14, color: '888888' });
      const rows = [['Project', 'Tasks', 'Done', '% complete']];
      for (const p of projects) {
        const ts = tasksOfProject(p.id);
        const ps = statsForTasks(ts);
        rows.push([p.name, String(ps.total), String(ps.done), ps.pct + '%']);
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
      slide.addText('Projects: ' + projects.length + ' · Tasks: ' + s.total + ' · ' + s.pct + '% done',
        { x: 0.5, y: 1.0, w: 12, h: 0.4, fontSize: 14, color: '888888' });
      const rows = [['Project', 'Tasks', 'Done', '% complete']];
      for (const p of projects) {
        const ts = tasksOfProject(p.id);
        const ps = statsForTasks(ts);
        rows.push([p.name, String(ps.total), String(ps.done), ps.pct + '%']);
      }
      slide.addTable(rows, { x: 0.5, y: 1.5, w: 12, fontSize: 12, border: { type: 'solid', color: 'DDDDDD', pt: 0.5 } });

      // Updates slide
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
      const ts = tasksOfProject(p.id);
      const ps = statsForTasks(ts);
      const slide = pptx.addSlide();
      slide.addText(p.name, { x: 0.5, y: 0.4, w: 12, h: 0.6, fontSize: 28, bold: true });
      slide.addText('Tasks: ' + ps.total + ' · ' + ps.pct + '% done', { x: 0.5, y: 1.0, w: 12, h: 0.4, fontSize: 14, color: '888888' });
      const rows = [['Task', 'Status', 'Created', 'Completed']];
      for (const t of ts) rows.push([t.title, t.status, fmtDate(t.createdAt), t.completedAt ? fmtDate(t.completedAt) : '—']);
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
      slide.addText('Status: ' + t.status + ' · Created ' + fmtDate(t.createdAt)
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
}

function exportXLSX() {
  const wb = XLSX.utils.book_new();

  const areas = state.data.areas.map(a => {
    const projects = projectsOfArea(a.id);
    const tasks = projects.flatMap(p => tasksOfProject(p.id));
    const s = statsForTasks(tasks);
    return { id: a.id, name: a.name, description: a.description, projects: projects.length, tasks: s.total, done: s.done, completion_pct: s.pct, created: a.createdAt };
  });
  const projects = state.data.projects.map(p => {
    const a = getArea(p.areaId);
    const ts = tasksOfProject(p.id);
    const s = statsForTasks(ts);
    return { id: p.id, area: a ? a.name : '', name: p.name, description: p.description, tasks: s.total, done: s.done, completion_pct: s.pct, created: p.createdAt };
  });
  const tasks = state.data.tasks.map(t => {
    const p = getProject(t.projectId);
    const a = p ? getArea(p.areaId) : null;
    return { id: t.id, area: a ? a.name : '', project: p ? p.name : '', title: t.title, description: t.description, status: t.status, created: t.createdAt, completed: t.completedAt || '' };
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
  document.getElementById('export-pdf').addEventListener('click', exportPDF);
  document.getElementById('export-ppt').addEventListener('click', exportPPT);
  document.getElementById('export-xlsx').addEventListener('click', exportXLSX);
  document.getElementById('lock-now').addEventListener('click', lockNow);
}

load();
bind();
initLock();
