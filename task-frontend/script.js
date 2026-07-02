const apiBase = 'http://127.0.0.1:8000/api';
const tasksList = document.getElementById('tasks');
const newTaskForm = document.getElementById('newTaskForm');
const loginForm = document.getElementById('loginForm');
const errorBox = document.getElementById('errorBox');
const loadingIndicator = document.getElementById('loading');
const authStatus = document.getElementById('authStatus');
let token = localStorage.getItem('taskApiToken') || '';

function showError(message) {
  errorBox.textContent = message;
  errorBox.classList.remove('hidden');
}

function clearError() {
  errorBox.textContent = '';
  errorBox.classList.add('hidden');
}

function updateAuthStatus(message, connected = false) {
  authStatus.textContent = message;
  authStatus.classList.toggle('connected', connected);
}

function getAuthHeaders() {
  const headers = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

async function request(url, options = {}) {
  try {
    const headers = {
      ...(options.headers || {}),
      ...getAuthHeaders(),
    };
    const response = await fetch(url, { ...options, headers });
    const body = await response.json().catch(() => null);
    if (!response.ok) {
      const errorMessage = body?.detail || body?.error || body?.message || response.statusText;
      throw new Error(errorMessage || 'Erreur inconnue');
    }
    return body;
  } catch (err) {
    if (err.name === 'TypeError') {
      throw new Error('Impossible de contacter le serveur. Vérifiez que l’API est lancée.');
    }
    throw err;
  }
}

function formatTaskItem(task) {
  const li = document.createElement('li');
  li.className = `task-item${task.is_done ? ' done' : ''}`;

  const title = document.createElement('h3');
  title.className = `task-title${task.is_done ? ' done' : ''}`;
  title.textContent = task.title;

  const created = document.createElement('small');
  created.textContent = `Créée le ${new Date(task.created_at).toLocaleString('fr-FR')}`;

  const description = document.createElement('p');
  description.className = 'task-description';
  description.textContent = task.description || 'Pas de description.';

  const buttonDone = document.createElement('button');
  buttonDone.className = 'done-btn';
  buttonDone.textContent = task.is_done ? 'Annuler' : 'Terminer';
  buttonDone.addEventListener('click', async () => {
    clearError();
    try {
      await updateTask(task.id, { is_done: !task.is_done });
      await loadTasks();
    } catch (err) {
      showError(err.message);
    }
  });

  const buttonDelete = document.createElement('button');
  buttonDelete.className = 'delete-btn';
  buttonDelete.textContent = 'Supprimer';
  buttonDelete.addEventListener('click', async () => {
    clearError();
    if (!confirm('Supprimer cette tâche ?')) return;
    try {
      await deleteTask(task.id);
      await loadTasks();
    } catch (err) {
      showError(err.message);
    }
  });

  const actions = document.createElement('div');
  actions.className = 'task-actions';
  actions.append(buttonDone, buttonDelete);

  const topRow = document.createElement('div');
  topRow.className = 'task-row';
  topRow.append(title, created);

  li.append(topRow, description, actions);
  return li;
}

async function loadTasks() {
  clearError();
  loadingIndicator.textContent = 'Chargement...';
  tasksList.innerHTML = '';

  if (!token) {
    loadingIndicator.textContent = 'Connectez-vous pour charger les tâches.';
    updateAuthStatus("Vous devez vous connecter pour utiliser l'API.");
    return;
  }

  try {
    const tasks = await request(`${apiBase}/tasks/`, {
      headers: { 'Content-Type': 'application/json' },
    });
    if (tasks.length === 0) {
      loadingIndicator.textContent = 'Aucune tâche trouvée.';
      return;
    }
    loadingIndicator.textContent = '';
    tasks.forEach((task) => tasksList.append(formatTaskItem(task)));
  } catch (err) {
    loadingIndicator.textContent = '';
    showError(err.message);
  }
}

async function createTask(title, description) {
  return request(`${apiBase}/tasks/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, description }),
  });
}

async function updateTask(id, data) {
  return request(`${apiBase}/tasks/${id}/`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

async function deleteTask(id) {
  return request(`${apiBase}/tasks/${id}/`, {
    method: 'DELETE',
  });
}

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  clearError();
  const username = event.target.username.value.trim();
  const password = event.target.password.value.trim();

  if (!username || !password) {
    showError('Nom d’utilisateur et mot de passe requis.');
    return;
  }

  try {
    const data = await request(`${apiBase}/auth/login/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    token = data.access;
    localStorage.setItem('taskApiToken', token);
    updateAuthStatus(`Connecté en tant que ${username}.`, true);
    event.target.reset();
    await loadTasks();
  } catch (err) {
    updateAuthStatus('Connexion impossible. Vérifiez vos identifiants.', false);
    showError(err.message);
  }
});

newTaskForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  clearError();
  const title = event.target.title.value.trim();
  const description = event.target.description.value.trim();
  if (!title) {
    showError('Le titre est requis.');
    return;
  }

  try {
    await createTask(title, description);
    event.target.reset();
    await loadTasks();
  } catch (err) {
    showError(err.message);
  }
});

window.addEventListener('DOMContentLoaded', () => {
  if (token) {
    updateAuthStatus('Token chargé depuis le navigateur.', true);
  }
  loadTasks();
});
