let tasks = [];
let selectedPlanId = null;
const API_BASE = 'http://127.0.0.1:8000/api/plans';
const userToken = localStorage.getItem('token');
let newSubtasksDraft = [];

function generateId() {
    try {
        if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    } catch (_) {}
    return 'st_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function renderNewSubtasksDraft() {
    const list = document.getElementById('new-subtasks-list');
    if (!list) return;
    list.innerHTML = '';
    newSubtasksDraft.forEach(st => {
        const li = document.createElement('li');
        li.textContent = st.text;
        const del = document.createElement('button');
        del.className = 'subtask-delete-btn';
        del.title = 'Remove';
        del.innerHTML = '✕';
        del.onclick = () => {
            newSubtasksDraft = newSubtasksDraft.filter(s => s.id !== st.id);
            renderNewSubtasksDraft();
        };
        li.appendChild(del);
        list.appendChild(li);
    });
}

async function fetchTasks() {
    try {
        // debugger;
        const res = await fetch(API_BASE, {
            headers: { 'Authorization': `Bearer ${userToken}` }
        });
        const data = await res.json();
        console.log('Fetched plans:', data); // Debug log
        if (data.status_code === 200 && Array.isArray(data.data)) {
            tasks = data.data;
            if (!selectedPlanId && tasks.length > 0) {
                selectedPlanId = tasks[0].id;
            }
            renderPlansSidebar();
            renderSelectedPlanSubtasks();
        } else {
            tasks = [];
            selectedPlanId = null;
            renderPlansSidebar();
            renderSelectedPlanSubtasks();
        }
    } catch (e) {
        console.error('Error fetching plans:', e); // Debug log
        tasks = [];
        selectedPlanId = null;
        renderPlansSidebar();
        renderSelectedPlanSubtasks();
    }
}

async function addSubtask(planId, text) {
    const plan = tasks.find(p => p.id === planId);
    if (!plan) return;
    const newSub = { id: generateId(), text, status: 'todo', due_date: '' };
    plan.subtasks = Array.isArray(plan.subtasks) ? [...plan.subtasks, newSub] : [newSub];
    renderSelectedPlanSubtasks();
    try {
        const res = await fetch(`${API_BASE}/${planId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${userToken}`
            },
            body: JSON.stringify({ subtasks: plan.subtasks })
        });
        const data = await res.json();
        if (data.status_code !== 200) {
            showToast(data.message || 'Failed to add subtask', true);
            await fetchTasks();
        } else {
            await fetchTasks();
        }
    } catch (e) {
        showToast('Failed to add subtask', true);
        await fetchTasks();
    }
}

async function deleteSubtask(planId, subtaskId) {
    const plan = tasks.find(p => p.id === planId);
    if (!plan) return;
    const original = plan.subtasks ? [...plan.subtasks] : [];
    plan.subtasks = (plan.subtasks || []).filter(st => st.id !== subtaskId);
    renderSelectedPlanSubtasks();
    try {
        const res = await fetch(`${API_BASE}/${planId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${userToken}`
            },
            body: JSON.stringify({ subtasks: plan.subtasks })
        });
        const data = await res.json();
        if (data.status_code !== 200) {
            showToast(data.message || 'Failed to delete subtask', true);
            plan.subtasks = original;
            await fetchTasks();
        } else {
            await fetchTasks();
        }
    } catch (e) {
        showToast('Failed to delete subtask', true);
        await fetchTasks();
    }
}

function renderPlansSidebar() {
    const list = document.getElementById('recent-plans-list');
    if (!list) return;
    list.innerHTML = '';
    if (!tasks.length) {
        list.innerHTML = `<div class='empty-chat-list'><p>No plans yet</p><p class='sub-text'>Add a new plan to get started</p></div>`;
        return;
    }
    tasks.forEach(plan => {
        const item = document.createElement('div');
        item.className = 'sidebar-plan-item' + (plan.id === selectedPlanId ? ' selected' : '');
        item.innerHTML = `
            <span class="plan-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="3" y="4" width="18" height="16" rx="2"/>
                    <path d="M16 2v4M8 2v4M3 10h18"/>
                </svg>
            </span>
            <span class="plan-title">${plan.title}</span>
            <button class="plan-delete-btn" title="Delete Plan">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
            </button>
        `;
        item.style.cursor = 'pointer';
        item.onclick = (e) => {
            // Prevent click if delete button (or its children) was clicked
            if (e.target.closest('.plan-delete-btn')) return;
            selectedPlanId = plan.id;
            renderPlansSidebar();
            renderSelectedPlanSubtasks();
        };
        // Add delete button (like dashboard)
        const deleteBtn = item.querySelector('.plan-delete-btn');
        deleteBtn.onclick = (e) => {
            e.stopPropagation();
            // Use showDeleteConfirmation for consistency
            showDeleteConfirmation(plan.id, 'single', plan.title);
        };
        list.appendChild(item);
    });
}

function renderSelectedPlanSubtasks() {
    const mainList = document.getElementById('task-list');
    mainList.innerHTML = '';
    mainList.classList.add('single-plan-view');

    if (!tasks.length) {
        mainList.innerHTML = `
            <div class="planner-empty-state">
                <div class="planner-empty-icon">
                    <svg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2'><rect x='3' y='3' width='18' height='18' rx='2'/><path d='M12 5v14M5 12h14'/></svg>
                </div>
                <h2>No plans yet</h2>
                <p>Start by adding a new plan or goal to organize your tasks.</p>
                <button id="empty-add-plan-btn" class="btn primary-btn">+ Add New Plan</button>
            </div>
        `;
        setTimeout(() => {
            const btn = document.getElementById('empty-add-plan-btn');
            if (btn) btn.onclick = () => {
                const addTaskModal = document.getElementById('add-task-modal');
                if (addTaskModal) {
                    addTaskModal.style.display = 'block';
                    setTimeout(() => addTaskModal.classList.add('show'), 10);
                }
            };
        }, 0);
        return;
    }

    if (!selectedPlanId) {
        mainList.innerHTML = `<div class='empty-chat-list'><p>No plan selected. Click a plan on the left.</p></div>`;
        return;
    }

    const plan = tasks.find(t => t.id === selectedPlanId);
    if (!plan) {
        mainList.innerHTML = `<div class='empty-chat-list'><p>Plan not found.</p></div>`;
        return;
    }

    // Plan Header
    const planHeader = document.createElement('div');
    planHeader.className = 'plan-header';
    planHeader.innerHTML = `<h2>${plan.title}</h2>${plan.description ? `<p>${plan.description}</p>` : ''}`;
    mainList.appendChild(planHeader);

    // Subtasks List in a scrollable container
    const subtasksContainer = document.createElement('div');
    subtasksContainer.className = 'subtasks-scrollable';
    if (plan.subtasks && plan.subtasks.length > 0) {
        const ul = document.createElement('ul');
        ul.className = 'subtasks-list';
        plan.subtasks.forEach(subtask => {
            const li = document.createElement('li');
            li.className = 'subtask-item';
            li.dataset.subtaskId = subtask.id;

            // Status Badge (color-coded, animated)
            const statusBadge = document.createElement('span');
            statusBadge.className = `subtask-status-badge status-${subtask.status}`;
            statusBadge.title = `Status: ${statusText(subtask.status)}. Click to change.`;
            statusBadge.textContent = getStatusEmoji(subtask.status);
            statusBadge.onclick = () => toggleSubtaskStatus(plan.id, subtask.id, subtask.status, statusBadge);

            // Subtask Text
            const textSpan = document.createElement('span');
            textSpan.className = 'subtask-text';
            textSpan.textContent = subtask.text;

            // Subtask Due Date (optional, unchanged)
            const dueDateContainer = document.createElement('div');
            dueDateContainer.className = 'subtask-due-date-container';
            const dueDateInput = document.createElement('input');
            dueDateInput.type = 'date';
            dueDateInput.className = 'subtask-due-date-input';
            dueDateInput.value = subtask.due_date || '';
            dueDateInput.onchange = (e) => updateSubtaskDueDate(plan.id, subtask.id, e.target.value, plan.due_date);
            const dueDateLabel = document.createElement('span');
            dueDateLabel.className = 'subtask-due-date-label';
            if (subtask.due_date) {
                dueDateLabel.textContent = `Due: ${subtask.due_date}`;
            }
            dueDateLabel.onclick = () => { dueDateInput.style.display = dueDateInput.style.display === 'none' ? 'inline-block' : 'none'; };
            if (!subtask.due_date) dueDateInput.style.display = 'inline-block';
            else dueDateInput.style.display = 'none';
            dueDateContainer.appendChild(dueDateLabel);
            dueDateContainer.appendChild(dueDateInput);

            // Delete subtask button
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'subtask-delete-btn';
            deleteBtn.title = 'Delete subtask';
            deleteBtn.innerHTML = '🗑';
            deleteBtn.onclick = () => deleteSubtask(plan.id, subtask.id);

            li.appendChild(statusBadge);
            li.appendChild(textSpan);
            li.appendChild(dueDateContainer);
            li.appendChild(deleteBtn);
            ul.appendChild(li);
        });
        subtasksContainer.appendChild(ul);
    } else {
        const noSubtasksMessage = document.createElement('p');
        noSubtasksMessage.className = 'empty-subtask-list';
        noSubtasksMessage.textContent = 'No subtasks for this plan yet.';
        subtasksContainer.appendChild(noSubtasksMessage);
    }
    // Add new subtask row
    const addRow = document.createElement('div');
    addRow.className = 'subtask-add-row';
    addRow.innerHTML = `
        <input type="text" class="plan-new-subtask-input" placeholder="Add a subtask...">
        <button class="btn secondary-btn">Add</button>
    `;
    const addInput = addRow.querySelector('input');
    const addBtn = addRow.querySelector('button');
    addBtn.onclick = () => {
        const t = addInput.value.trim();
        if (!t) return;
        addSubtask(plan.id, t);
        addInput.value = '';
    };
    addInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const t = addInput.value.trim();
            if (!t) return;
            addSubtask(plan.id, t);
            addInput.value = '';
        }
    });
    subtasksContainer.appendChild(addRow);
    mainList.appendChild(subtasksContainer);
}

function getStatusEmoji(status) {
    if (status === 'done') return '✅';
    if (status === 'in_progress') return '⏳';
    return '⚪'; // todo
}

function statusText(status) {
    if (status === 'done') return 'Completed';
    if (status === 'in_progress') return 'In Progress';
    return 'Not Started';
}

async function toggleSubtaskStatus(planId, subtaskId, currentStatus, badgeEl) {
    const statuses = ['todo', 'in_progress', 'done'];
    let currentIdx = statuses.indexOf(currentStatus);
    let nextIdx = (currentIdx + 1) % statuses.length;
    const newStatus = statuses[nextIdx];
    // Animate badge color
    if (badgeEl) {
        badgeEl.classList.remove(`status-${currentStatus}`);
        badgeEl.classList.add(`status-${newStatus}`);
        badgeEl.textContent = getStatusEmoji(newStatus);
    }
    await updateSubtaskProperty(planId, subtaskId, { status: newStatus });
}

async function updateSubtaskDueDate(planId, subtaskId, newDueDate, planDueDate) {
    if (newDueDate && planDueDate && new Date(newDueDate) > new Date(planDueDate)) {
        showToast("Subtask due date cannot be after the plan's due date!", true);
        // Optionally, revert the input value here or prevent update
        // For now, we'll allow the API call but the user is warned.
        // To revert: re-render or find the input and reset its value to the previous one.
    }
    await updateSubtaskProperty(planId, subtaskId, { due_date: newDueDate });
}

async function updateSubtaskProperty(planId, subtaskId, propertiesToUpdate) {
    const plan = tasks.find(p => p.id === planId);
    if (!plan) return;

    const subtask = plan.subtasks.find(st => st.id === subtaskId);
    if (!subtask) return;

    // Optimistically update UI
    for (const key in propertiesToUpdate) {
        subtask[key] = propertiesToUpdate[key];
    }
    renderSelectedPlanSubtasks(); // Re-render to show changes

    try {
        const res = await fetch(`${API_BASE}/${planId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${userToken}`
            },
            // Send the whole plan with updated subtasks list
            body: JSON.stringify({ subtasks: plan.subtasks }) 
        });
        const data = await res.json();
        if (data.status_code !== 200) {
            showToast(data.message || 'Error updating subtask', true);
            // Revert optimistic update if API call fails (more complex, requires storing old state)
            await fetchTasks(); // For now, just refetch to get true state
        }
    } catch (e) {
        showToast('Error updating subtask', true);
        await fetchTasks(); // Refetch
    }
}

function renderTasks() {
    const list = document.getElementById('task-list');
    list.innerHTML = '';
    list.classList.remove('single-plan-view');
    if (!tasks.length) {
        list.innerHTML = `<div class='empty-chat-list'><p>No tasks yet</p></div>`;
        return;
    }
    tasks.forEach(task => {
        const card = document.createElement('div');
        card.className = 'task-card fade-in';
        card.innerHTML = `
            <div class='task-title'>${task.title}</div>
            <div class='task-desc'>${task.description || ''}</div>
            <div class='task-meta'>
                <span class='status-badge ${task.status}'>${statusText(task.status)}</span>
                <span class='priority-badge ${task.priority}'>${capitalize(task.priority)}</span>
                ${task.due_date ? `<span class='due-date'>Due: ${task.due_date}</span>` : ''}
            </div>
            <div class='task-actions'>
                <button class='task-action-btn' onclick='markStatus("${task.id}")' title='Toggle Status'>
                    <svg width='20' height='20' fill='none' stroke='currentColor' stroke-width='2'><path d='M5 13l4 4L19 7'/></svg>
                </button>
                <button class='task-action-btn' onclick='editTaskModal("${task.id}")' title='Edit'>
                    <svg width='20' height='20' fill='none' stroke='currentColor' stroke-width='2'><path d='M12 20h9'/><path d='M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19.5 3 21l1.5-4L16.5 3.5z'/></svg>
                </button>
                <button class='task-action-btn' onclick='deleteTask("${task.id}")' title='Delete'>
                    <svg width='20' height='20' fill='none' stroke='currentColor' stroke-width='2'><path d='M3 6h18M9 6v12a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2V6'/></svg>
                </button>
                <button class='task-action-btn' onclick='suggestSubtasks("${task.id}", this)' title='Suggest Subtasks'>
                    <svg width='20' height='20' fill='none' stroke='currentColor' stroke-width='2'><circle cx='12' cy='12' r='10'/><path d='M8 12h8M12 8v8'/></svg>
                </button>
            </div>
            <div class='subtasks-container' style='display:none;'></div>
        `;
        list.appendChild(card);
    });
}

window.editTaskModal = function(id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    document.getElementById('edit-task-title').value = task.title;
    document.getElementById('edit-task-desc').value = task.description || '';
    document.getElementById('edit-task-due').value = task.due_date || '';
    document.getElementById('edit-task-priority').value = task.priority || 'medium';
    document.getElementById('edit-task-modal').style.display = 'block';
    document.getElementById('edit-task-form').dataset.taskId = id;
};

document.getElementById('edit-task-form').onsubmit = function(e) {
    e.preventDefault();
    const id = e.target.dataset.taskId;
    const title = document.getElementById('edit-task-title').value.trim();
    const description = document.getElementById('edit-task-desc').value.trim();
    const due_date = document.getElementById('edit-task-due').value;
    const priority = document.getElementById('edit-task-priority').value;
    if (!title) {
        showError('edit-task-error', 'Title is required');
        return;
    }
    fetch(`${API_BASE}/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${userToken}`
        },
        body: JSON.stringify({ title, description, due_date, priority })
    })
    .then(res => res.json())
    .then(data => {
        if (data.status_code === 200) {
            document.getElementById('edit-task-modal').style.display = 'none';
            fetchTasks();
        } else {
            showError('edit-task-error', data.message || 'Error editing task');
        }
    });
};
// Close edit modal
const editModal = document.getElementById('edit-task-modal');
editModal.querySelector('.close').onclick = function() {
    editModal.style.display = 'none';
};
window.onclick = function(event) {
    if (event.target === editModal) {
        editModal.style.display = 'none';
    }
};

// Drag-and-drop reordering with SortableJS
function enableDragAndDrop() {
    if (window.Sortable) {
        Sortable.create(document.getElementById('task-list'), {
            animation: 200,
            handle: '.task-card',
            ghostClass: 'drag-ghost',
            onEnd: function (evt) {
                const ids = Array.from(document.querySelectorAll('.task-card')).map(card => {
                    const title = card.querySelector('.task-title').textContent;
                    const task = tasks.find(t => t.title === title);
                    return task ? task.id : null;
                }).filter(Boolean);
                fetch(`${API_BASE}/reorder`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${userToken}`
                    },
                    body: JSON.stringify({ order: ids })
                }).then(() => fetchTasks());
            }
        });
    }
}
// Load SortableJS dynamically if not present
if (!window.Sortable) {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/sortablejs@1.15.0/Sortable.min.js';
    script.onload = enableDragAndDrop;
    document.body.appendChild(script);
} else {
    enableDragAndDrop();
}
// Call enableDragAndDrop after rendering tasks
const origRenderTasks = renderTasks;
renderTasks = function() {
    origRenderTasks.apply(this, arguments);
    enableDragAndDrop();
};

window.suggestSubtasks = function(id, btn) {
    const card = btn.closest('.task-card');
    const subtasksContainer = card.querySelector('.subtasks-container');
    subtasksContainer.style.display = 'block';
    subtasksContainer.innerHTML = `<div class='fade-in' style='color:var(--primary);padding:8px 0;'>Generating subtasks...</div>`;
    fetch(`${API_BASE}/${id}/suggest`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${userToken}` }
    })
    .then(res => res.json())
    .then(data => {
        if (data.status_code === 200 && Array.isArray(data.data)) {
            subtasksContainer.innerHTML = `<ul class='fade-in' style='margin-top:8px;'>${data.data.map(s => `<li style='list-style:circle;margin-bottom:4px;'><input type='checkbox' style='margin-right:8px;'>${s}</li>`).join('')}</ul>`;
        } else {
            subtasksContainer.innerHTML = `<div class='fade-in' style='color:var(--destructive);'>No subtasks found.</div>`;
        }
    })
    .catch(() => {
        subtasksContainer.innerHTML = `<div class='fade-in' style='color:var(--destructive);'>Error generating subtasks.</div>`;
    });
};

// Dashboard button in planner sidebar
const dashboardBtn = document.getElementById('dashboard-btn');
if (dashboardBtn) {
    dashboardBtn.onclick = () => {
        document.body.style.opacity = 0;
        setTimeout(() => { window.location.href = 'dashboard.html'; }, 250);
    };
}

// === SIDEBAR COLLAPSE ===
const sidebar = document.querySelector('.sidebar');
const collapseBtn = document.getElementById('collapse-sidebar');

// Check if sidebar state is saved in localStorage
const isSidebarCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
if (isSidebarCollapsed && sidebar) {
    sidebar.classList.add('collapsed');
    if (collapseBtn) collapseBtn.classList.add('rotated');
}

// Toggle sidebar on button click
if (collapseBtn && sidebar) {
    collapseBtn.addEventListener('click', () => {
        sidebar.classList.toggle('collapsed');
        collapseBtn.classList.toggle('rotated');
        localStorage.setItem('sidebarCollapsed', sidebar.classList.contains('collapsed'));
    });
}

// === ADD TASK MODAL OPEN/CLOSE ===
const addTaskBtn = document.getElementById('add-task-btn');
const addTaskModal = document.getElementById('add-task-modal');
const addTaskClose = addTaskModal ? addTaskModal.querySelector('.close') : null;
if (addTaskBtn && addTaskModal && addTaskClose) {
    addTaskBtn.onclick = () => {
        addTaskModal.style.display = 'block';
        setTimeout(() => addTaskModal.classList.add('show'), 10);
        // reset modal subtasks
        newSubtasksDraft = [];
        renderNewSubtasksDraft();
        const input = document.getElementById('new-subtask-text');
        if (input) input.value = '';
    };
    addTaskClose.onclick = () => {
        addTaskModal.classList.remove('show');
        setTimeout(() => addTaskModal.style.display = 'none', 300);
        newSubtasksDraft = [];
        renderNewSubtasksDraft();
    };
    window.addEventListener('click', (e) => {
        if (e.target === addTaskModal) {
            addTaskModal.classList.remove('show');
            setTimeout(() => addTaskModal.style.display = 'none', 300);
            newSubtasksDraft = [];
            renderNewSubtasksDraft();
        }
    });
}

// === THEME TOGGLE ===
const themeToggle = document.getElementById('theme-toggle');
const htmlRoot = document.documentElement;
function setTheme(mode) {
    if (mode === 'dark') {
        htmlRoot.classList.add('dark');
        htmlRoot.classList.remove('light');
        localStorage.setItem('theme', 'dark');
        if (themeToggle) themeToggle.checked = true;
    } else {
        htmlRoot.classList.remove('dark');
        htmlRoot.classList.add('light');
        localStorage.setItem('theme', 'light');
        if (themeToggle) themeToggle.checked = false;
    }
}
if (themeToggle) {
    themeToggle.onchange = function() {
        setTheme(this.checked ? 'dark' : 'light');
    };
    // On load
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) setTheme(savedTheme);
}

// === TOAST NOTIFICATION ===
function showToast(message, isError = false) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.style.backgroundColor = isError ? '#ef4444' : '#4263eb';
    toast.style.display = 'block';
    toast.style.height = '50px';
    toast.style.zIndex = '9999';
    setTimeout(() => {
        toast.style.display = 'none';
    }, 3000);
}

// === SETTINGS MODAL LOGIC (copied from dashboard) ===
function setupSettingsModal() {
    const settingsBtn = document.getElementById('settings-btn');
    const settingsModal = document.getElementById('settings-modal');
    const mainCard = settingsModal.querySelector('.settings-step-1');
    const profileCard = document.getElementById('profile-card');
    const tasksCard = document.getElementById('tasks-card');
    const openProfileBtn = document.getElementById('open-profile-card');
    const openTasksBtn = document.getElementById('open-tasks-card');
    const closeButtons = settingsModal.querySelectorAll('.close');
    const profileForm = document.getElementById('profile-form');
    const deleteAllTasksBtn = document.getElementById('delete-all-tasks-btn');
    function showCard(card) {
        mainCard.style.display = 'none';
        profileCard.style.display = 'none';
        tasksCard.style.display = 'none';
        profileCard.classList.remove('active');
        tasksCard.classList.remove('active');
        if (card === 'profile') {
            profileCard.style.display = 'block';
            setTimeout(() => profileCard.classList.add('active'), 10);
            loadUserProfile();
        } else if (card === 'tasks') {
            tasksCard.style.display = 'block';
            setTimeout(() => tasksCard.classList.add('active'), 10);
            populateSettingsTaskList();
        }
    }
    function showMainCard() {
        mainCard.style.display = 'block';
        profileCard.style.display = 'none';
        tasksCard.style.display = 'none';
        profileCard.classList.remove('active');
        tasksCard.classList.remove('active');
    }
    if (settingsBtn && settingsModal) {
        settingsBtn.addEventListener('click', () => {
            settingsModal.classList.add('show');
            showMainCard();
        });
    }
    if (openProfileBtn) {
        openProfileBtn.addEventListener('click', () => {
            showCard('profile');
        });
    }
    if (openTasksBtn) {
        openTasksBtn.addEventListener('click', () => {
            showCard('tasks');
        });
    }
    if (closeButtons) {
        closeButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                if (profileCard.classList.contains('active') || tasksCard.classList.contains('active')) {
                    showMainCard();
                } else {
                    settingsModal.classList.remove('show');
                }
            });
        });
    }
    window.addEventListener('click', (e) => {
        if (e.target === settingsModal) {
            settingsModal.classList.remove('show');
        }
    });
    if (profileForm) {
        profileForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('name').value;
            const username = document.getElementById('username').value;
            const email = document.getElementById('email').value;
            const currentPassword = document.getElementById('current-password').value;
            const newPassword = document.getElementById('new-password').value;
            const errorMsg = document.getElementById('profile-error');
            errorMsg.style.display = 'none';
            const updateData = {};
            if (name) updateData.name = name;
            if (username) updateData.username = username;
            if (email) updateData.email = email;
            if (currentPassword) updateData.current_password = currentPassword;
            if (newPassword) updateData.new_password = newPassword;
            try {
                const token = localStorage.getItem('token');
                if (!token) throw new Error('Authentication required');
                const response = await fetch(`http://127.0.0.1:8000/api/profile`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(updateData)
                });
                const data = await response.json();
                if (!response.ok) {
                    throw new Error(data.detail || 'Failed to update profile');
                }
                if (updateData.username) {
                    localStorage.setItem('username', updateData.username);
                }
                showToast('Profile updated successfully');
                settingsModal.classList.remove('show');
            } catch (error) {
                console.error('Error updating profile:', error);
                errorMsg.textContent = error.message;
                errorMsg.style.display = 'block';
            }
        });
    }
    if (deleteAllTasksBtn) {
        deleteAllTasksBtn.addEventListener('click', () => {
            showDeleteConfirmation(null, 'all-tasks');
        });
    }
}
async function loadUserProfile() {
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');
    if (!token || !userId) return;
    try {
        const response = await fetch(`http://127.0.0.1:8000/api/user/${userId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (!response.ok) {
            throw new Error('Failed to fetch user data');
        }
        const userData = await response.json();
        document.getElementById('name').value = userData.name || '';
        document.getElementById('username').value = userData.username || '';
        document.getElementById('email').value = userData.email || '';
    } catch (error) {
        console.error('Error fetching user profile:', error);
        showToast('Failed to load profile data', true);
    }
}
function populateSettingsTaskList() {
    const taskList = document.getElementById('settings-task-list');
    if (!taskList) return;
    const emptyMessage = taskList.querySelector('.empty-list-message');
    taskList.innerHTML = '';
    if (emptyMessage) taskList.appendChild(emptyMessage);
    if (tasks && tasks.length > 0) {
        if (emptyMessage) emptyMessage.style.display = 'none';
        tasks.forEach(task => {
            const taskItem = document.createElement('div');
            taskItem.className = 'settings-task-item';
            taskItem.innerHTML = `
                <div class="task-info">
                    <span class="task-title">${task.title}</span>
                </div>
                <button class="delete-task-btn" title="Delete Task">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                </button>
            `;
            // Add delete button functionality
            const deleteBtn = taskItem.querySelector('.delete-task-btn');
            if (deleteBtn) {
                deleteBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    showDeleteConfirmation(task.id, 'single', task.title);
                });
            }
            taskList.appendChild(taskItem);
        });
    } else {
        if (emptyMessage) emptyMessage.style.display = 'block';
    }
}
function showDeleteConfirmation(fileId, type = 'single', fileName = '') {
    const modal = document.getElementById('delete-confirm-modal');
    const messageText = modal.querySelector('p');
    if (!modal) return;
    modal.dataset.fileId = fileId || '';
    modal.dataset.deleteType = type;
    if (type === 'all') {
        messageText.textContent = 'Are you sure you want to delete ALL tasks? This action cannot be undone.';
    } else {
        messageText.textContent = `Are you sure you want to delete the task "${fileName}"? This action cannot be undone.`;
    }
    modal.style.display = 'block';
    setTimeout(() => modal.classList.add('show'), 10);
}
function setupDeleteConfirmModal() {
    const modal = document.getElementById('delete-confirm-modal');
    const closeBtn = modal.querySelector('.close');
    const cancelBtn = document.getElementById('cancel-delete-btn');
    const closeModal = () => {
        modal.classList.remove('show');
        setTimeout(() => { modal.style.display = 'none'; }, 300);
        modal.dataset.fileId = '';
        modal.dataset.deleteType = '';
    };
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (cancelBtn) cancelBtn.addEventListener('click', closeModal);
    window.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });
    const confirmBtn = document.getElementById('confirm-delete-btn');
    if (confirmBtn) {
        confirmBtn.addEventListener('click', async () => {
            const fileId = modal.dataset.fileId;
            const deleteType = modal.dataset.deleteType;
            try {
                let deleted = false;
                if (deleteType === 'single' && fileId) {
                    deleted = await deletePlan(fileId, true); // pass flag to delay toast
                } else {
                    showToast('Nothing to delete in planner.');
                }
                closeModal();
                // Show toast after modal is closed and UI is refreshed
                if (deleted) {
                    setTimeout(() => showToast('Plan deleted successfully'), 250);
                }
            } catch (error) {
                showToast('Failed to delete.', true);
            }
        });
    }
}
// Dummy fetchFiles/deleteFile/fetchAllFiles for settings modal compatibility
async function fetchFiles() {}
async function deleteFile(fileId) {}
async function fetchAllFiles() { return []; }

// === LOGOUT BUTTON (OPTIONAL) ===
const logoutBtn = document.getElementById('logout-btn');
if (logoutBtn) {
    logoutBtn.onclick = () => {
        localStorage.removeItem('userToken');
        window.location.href = 'login.html';
    };
}

// === TASKS FETCHING AND RENDERING ===
// Remove the duplicate fetchTasks function below (lines 547+)
// === TASKS FETCHING AND RENDERING ===
// Add Task Modal submit
const addTaskForm = document.getElementById('add-task-form');
if (addTaskForm) {
    // wire add-subtask controls inside modal
    const addNewSubtaskBtn = document.getElementById('add-new-subtask-btn');
    const newSubtaskInput = document.getElementById('new-subtask-text');
    function addDraftSubtaskFromInput() {
        const text = newSubtaskInput ? newSubtaskInput.value.trim() : '';
        if (!text) return;
        newSubtasksDraft.push({ id: generateId(), text, status: 'todo', due_date: '' });
        if (newSubtaskInput) newSubtaskInput.value = '';
        renderNewSubtasksDraft();
    }
    if (addNewSubtaskBtn) addNewSubtaskBtn.onclick = addDraftSubtaskFromInput;
    if (newSubtaskInput) newSubtaskInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addDraftSubtaskFromInput();
        }
    });

    addTaskForm.onsubmit = async function(e) {
        e.preventDefault();
        const title = document.getElementById('task-title').value.trim();
        const description = document.getElementById('task-desc').value.trim();
        const due_date = document.getElementById('task-due').value;
        const priority = document.getElementById('task-priority').value;
        if (!title) {
            showError('add-task-error', 'Title is required');
            return;
        }
        try {
            const res = await fetch(API_BASE, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${userToken}`
                },
                body: JSON.stringify({ title, description, due_date, priority, subtasks: newSubtasksDraft })
            });
            const data = await res.json();
            if (data.status_code === 200) {
                document.getElementById('add-task-modal').classList.remove('show');
                setTimeout(() => document.getElementById('add-task-modal').style.display = 'none', 300);
                // Select the new plan and show its subtasks
                selectedPlanId = data.data.id;
                await fetchTasks(); // This will update sidebar and main content
                addTaskForm.reset();
                newSubtasksDraft = [];
                renderNewSubtasksDraft();
            } else {
                showError('add-task-error', data.message || 'Error adding plan');
            }
        } catch (e) {
            showError('add-task-error', 'Error adding plan');
        }
    };
}

// Helper to show error
function showError(id, msg) {
    const el = document.getElementById(id);
    if (el) {
        el.textContent = msg;
        el.style.display = 'block';
        setTimeout(() => { el.style.display = 'none'; }, 3000);
    }
}

// On page load
window.addEventListener('DOMContentLoaded', () => {
    fetchTasks();
    setupSettingsModal();
    setupDeleteConfirmModal();
});

// Add deletePlan function
async function deletePlan(planId, skipToast) {
    try {
        const res = await fetch(`${API_BASE}/${planId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${userToken}` }
        });
        const data = await res.json();
        if (data.status_code === 200) {
            // If the deleted plan was selected, clear selection
            if (selectedPlanId === planId) selectedPlanId = null;
            await fetchTasks();
            // If no plans remain, show add new plan modal
            if (!tasks.length) {
                setTimeout(() => {
                    const addTaskModal = document.getElementById('add-task-modal');
                    if (addTaskModal) {
                        addTaskModal.style.display = 'block';
                        setTimeout(() => addTaskModal.classList.add('show'), 10);
                    }
                }, 300);
            }
            if (!skipToast) showToast('Plan deleted successfully');
            return true;
        } else {
            showToast(data.message || 'Failed to delete plan', true);
            return false;
        }
    } catch (e) {
        showToast('Failed to delete plan', true);
        return false;
    }
} 