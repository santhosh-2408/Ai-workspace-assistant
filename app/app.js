// API URL
const API_BASE_URL = 'http://127.0.0.1:8000/api';

// Add initialization with debugging
document.addEventListener('DOMContentLoaded', () => {
    console.log('App initialized');
    checkAuth();
    
    // Setup appropriate page
    if (window.location.pathname.includes('index.html') || window.location.pathname === '/') {
        setupLoginPage();
    } else if (window.location.pathname.includes('dashboard.html')) {
        setupDashboard();
    }
    
    // Apply saved theme if exists
    applyTheme();
});

// Check if user is logged in
function checkAuth() {
    const token = localStorage.getItem('token');
    console.log('Checking auth, token exists:', !!token);
    
    // If on login page but already logged in, redirect to dashboard
    if ((window.location.pathname.includes('index.html') || window.location.pathname === '/') && token) {
        showWelcomeToast(localStorage.getItem('username'));
    }
    
    // If on dashboard but not logged in, redirect to login
    if (window.location.pathname.includes('dashboard.html') && !token) {
        window.location.href = 'index.html';
    }
}

// Show a toast notification
function showToast(message, isError = false) {
    console.log('Toast:', message, isError ? 'error' : 'success');
    const toast = document.getElementById('toast');
    if (!toast) return;
    
    toast.textContent = message;
    toast.style.backgroundColor = isError ? '#ef4444' : '#4263eb';
    toast.style.display = 'block';
    toast.style.height = '50px';
    
    // Ensure the toast appears above all elements including sidebar footer
    toast.style.zIndex = '9999';
    
    setTimeout(() => {
        toast.style.display = 'none';
    }, 3000);
}

// Theme Toggle
function applyTheme() {
    const theme = localStorage.getItem('theme') || 'light';
    const htmlElement = document.documentElement;
    
    if (theme === 'dark') {
        htmlElement.classList.add('dark');
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) themeToggle.checked = true;
    } else {
        htmlElement.classList.remove('dark');
    }
}

// ===== LOGIN PAGE FUNCTIONS =====
function setupLoginPage() {
    console.log('Setting up login page');
    const loginBtn = document.getElementById('login-btn');
    const registerLink = document.getElementById('register-link');
    const registerModal = document.getElementById('register-modal');
    const closeModal = document.querySelector('.close');
    const registerBtn = document.getElementById('register-btn');
    
    if (loginBtn) {
        loginBtn.addEventListener('click', async () => {
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            const errorMsg = document.getElementById('login-error');
            
            if (!username || !password) {
                errorMsg.textContent = 'Please enter both username and password';
                errorMsg.style.display = 'block';
                return;
            }
            
            try {
                console.log('Attempting login for:', username);
                errorMsg.style.display = 'none';
                loginBtn.disabled = true;
                loginBtn.textContent = 'Logging in...';
                
                // Log the request details
                console.log('Login request to:', `${API_BASE_URL}/token`);
                
                const response = await fetch(`${API_BASE_URL}/token`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: `username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`,
                });
                
                console.log('Login response status:', response.status);
                const data = await response.json();
                console.log('Login response data:', data);
                
                if (!response.ok) {
                    throw new Error(data.detail || 'Login failed');
                }
                
                localStorage.setItem('token', data.access_token);
                localStorage.setItem('userId', data.user_id || '');
                localStorage.setItem('username', username);
                
                // Clear any previous file selection so user lands on upload screen after login
                localStorage.removeItem('selectedFileId');
                localStorage.removeItem('selectedFileName');
                // Set active tab preference to "upload"
                localStorage.setItem('activeTab', 'upload');
                
                console.log('Login successful, will show welcome toast on dashboard');
                localStorage.setItem('showWelcomeToast', 'true');
                window.location.href = 'dashboard.html';
            } catch (error) {
                console.error('Login error:', error);
                errorMsg.textContent = error.message;
                errorMsg.style.display = 'block';
            } finally {
                loginBtn.disabled = false;
                loginBtn.textContent = 'Login';
            }
        });
    }
    
    // Register modal functionality
    if (registerLink && registerModal && closeModal) {
        registerLink.addEventListener('click', (e) => {
            e.preventDefault();
            registerModal.style.display = 'block';
        });
        
        closeModal.addEventListener('click', () => {
            registerModal.style.display = 'none';
        });
        
        window.addEventListener('click', (e) => {
            if (e.target === registerModal) {
                registerModal.style.display = 'none';
            }
        });
    }
    
    // Register functionality
    if (registerBtn) {
        registerBtn.addEventListener('click', async () => {
            // Get values - handle missing fields in case HTML wasn't updated
            const nameInput = document.getElementById('reg-name');
            const name = nameInput ? nameInput.value : document.getElementById('reg-username').value;
            const username = document.getElementById('reg-username').value;
            const emailInput = document.getElementById('reg-email');
            const email = emailInput ? emailInput.value : `${username}@example.com`;
            const password = document.getElementById('reg-password').value;
            const errorMsg = document.getElementById('register-error');
            
            // Validation based on available fields
            if (!username || !password) {
                errorMsg.textContent = 'Please fill in all required fields';
                errorMsg.style.display = 'block';
                return;
            }
            
            try {
                console.log('Attempting registration for:', username);
                errorMsg.style.display = 'none';
                registerBtn.disabled = true;
                registerBtn.textContent = 'Creating account...';
                
                const requestBody = {
                    name: name || username,
                    username: username,
                    email: email || `${username}@example.com`,
                    password: password
                };
                
                console.log('Registration request:', requestBody);
                
                const response = await fetch(`${API_BASE_URL}/register`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(requestBody),
                });
                
                console.log('Registration response status:', response.status);
                const data = await response.json();
                console.log('Registration response data:', data);
                
                if (!response.ok) {
                    throw new Error(data.detail || 'Registration failed');
                }
                
                registerModal.style.display = 'none';
                alert('Registration successful! You can now login.');
                
                // Clear registration form
                if (nameInput) nameInput.value = '';
                document.getElementById('reg-username').value = '';
                if (emailInput) emailInput.value = '';
                document.getElementById('reg-password').value = '';
            } catch (error) {
                console.error('Registration error:', error);
                errorMsg.textContent = error.message;
                errorMsg.style.display = 'block';
            } finally {
                registerBtn.disabled = false;
                registerBtn.textContent = 'Register';
            }
        });
    }
}

// ===== DASHBOARD PAGE FUNCTIONS =====
function setupDashboard() {
    const username = localStorage.getItem('username') || 'User';
    
    // Show welcome toast if flagged
    if (localStorage.getItem('showWelcomeToast') === 'true') {
        showWelcomeToast(username);
        localStorage.removeItem('showWelcomeToast');
    }
    
    // Setup sidebar toggling
    setupSidebar();
    
    // Setup theme toggle
    setupThemeToggle();
    
    // Setup tabs
    setupTabs();
    
    // Setup logout
    setupLogout();
    
    // Setup upload functionality
    setupUpload();
    
    // Fetch and display files
    fetchFiles();
    
    // Setup query functionality
    setupQuery();
    
    // Setup settings modal
    setupSettingsModal();
    
    // Setup delete confirmation modal
    setupDeleteConfirmModal();
    
    // Setup document tab
    setupDocumentTab();

    // Planner button in dashboard sidebar
    const plannerBtn = document.getElementById('planner-btn');
    if (plannerBtn) {
        plannerBtn.onclick = () => {
            document.body.style.opacity = 0;
            setTimeout(() => { window.location.href = 'planner.html'; }, 250);
        };
    }
}

// Welcome toast animation function
function showWelcomeToast(username) {
    const welcomeToast = document.getElementById('welcome-toast');
    const toastUsername = document.getElementById('toast-username');
    const secondMessage = document.getElementById('secondMessage');
    const actionButtons = document.getElementById('actionButtons');
    const dashboardBtn = document.getElementById('welcome-dashboard-btn');
    const plannerBtn = document.getElementById('welcome-planner-btn');

    // Reset state
    if (actionButtons) {
        actionButtons.classList.remove('show');
        actionButtons.style.display = 'none';
    }
    if (secondMessage) {
        secondMessage.classList.remove('show');
        secondMessage.style.opacity = 0;
    }
    if (welcomeToast) {
        welcomeToast.style.display = 'flex';
        welcomeToast.classList.add('show');
    }

    // Set username
    if (toastUsername) toastUsername.textContent = username;

    // Animate first message (already visible)
    // After 1.5s, show second message (add .show)
    setTimeout(() => {
        if (secondMessage) {
            secondMessage.classList.add('show');
            secondMessage.style.opacity = 1;
        }
    }, 1500);

    // After 3.6s (1.5s + 1.3s + 0.8s), show action buttons
    setTimeout(() => {
        if (actionButtons) {
            actionButtons.style.display = 'flex';
            setTimeout(() => actionButtons.classList.add('show'), 10);
        }
    }, 3600);

    // Button click handlers
    if (dashboardBtn) {
        dashboardBtn.onclick = () => {
            if (welcomeToast) welcomeToast.style.display = 'none';
            if (actionButtons) actionButtons.style.display = 'none';
            window.location.href = 'dashboard.html';
        };
    }
    if (plannerBtn) {
        plannerBtn.onclick = () => {
            if (welcomeToast) welcomeToast.style.display = 'none';
            if (actionButtons) actionButtons.style.display = 'none';
            window.location.href = 'planner.html';
        };
    }
}

// Setup sidebar functionality
function setupSidebar() {
    const sidebar = document.querySelector('.sidebar');
    const collapseBtn = document.getElementById('collapse-sidebar');
    const newChatBtn = document.getElementById('new-chat-btn');
    
    // Check if sidebar state is saved in localStorage
    const isSidebarCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
    if (isSidebarCollapsed && sidebar) {
        sidebar.classList.add('collapsed');
    }
    
    // Toggle sidebar on button click
    if (collapseBtn && sidebar) {
        collapseBtn.addEventListener('click', () => {
            sidebar.classList.toggle('collapsed');
            localStorage.setItem('sidebarCollapsed', sidebar.classList.contains('collapsed'));
        });
    }
    
    // New chat button
    if (newChatBtn) {
        newChatBtn.addEventListener('click', () => {
            // Show upload UI, hide chat UI
            const uploadContainer = document.getElementById('upload-container');
            const chatContainer = document.getElementById('chat-container');
            
            if (uploadContainer && chatContainer) {
                uploadContainer.style.display = 'flex';
                chatContainer.style.display = 'none';
            }
            
            // Switch to chat tab if not already active
            const chatTabBtn = document.querySelector('.tab-btn[data-tab="chat"]');
            if (chatTabBtn && !chatTabBtn.classList.contains('active')) {
                chatTabBtn.click();
            }
        });
    }
}

// Setup theme toggle
function setupThemeToggle() {
    const themeToggle = document.getElementById('theme-toggle');
    
    if (themeToggle) {
        // Set initial state based on localStorage
        const currentTheme = localStorage.getItem('theme') || 'light';
        themeToggle.checked = currentTheme === 'dark';
        
        // Handle toggle change
        themeToggle.addEventListener('change', () => {
            const htmlElement = document.documentElement;
            
            if (themeToggle.checked) {
                htmlElement.classList.add('dark');
                localStorage.setItem('theme', 'dark');
            } else {
                htmlElement.classList.remove('dark');
                localStorage.setItem('theme', 'light');
            }
        });
    }
}

// Setup tab switching
function setupTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabName = btn.getAttribute('data-tab');
            
            console.log('Switching to tab:', tabName);
            
            // Hide all tabs
            document.querySelectorAll('.tab-content').forEach(tab => {
                tab.classList.remove('active');
            });
            
            // Remove active class from all buttons
            tabBtns.forEach(b => {
                b.classList.remove('active');
            });
            
            // Show active tab
            const activeTab = document.getElementById(`${tabName}-tab`);
            if (activeTab) {
                activeTab.classList.add('active');
                btn.classList.add('active');
            }
        });
    });
}

// Setup logout functionality
function setupLogout() {
    const logoutBtn = document.getElementById('logout-btn');
    
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('token');
            localStorage.removeItem('userId');
            localStorage.removeItem('username');
            window.location.href = 'index.html';
        });
    }
}

// Fetch user's files
async function fetchFiles() {
    const token = localStorage.getItem('token');
    const fileList = document.getElementById('file-list');
    const emptyList = document.querySelector('.empty-chat-list');
    
    if (!token || !fileList) return;
    
    console.log('Fetching files with token:', token);
    
    try {
        const response = await fetch(`${API_BASE_URL}/files`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        console.log('Files response status:', response.status);
        const data = await response.json();
        console.log('Files data:', data);
        
        if (data.files && data.files.length > 0) {
            // Show files
            if (emptyList) {
                emptyList.style.display = 'none';
            }
            // Clear existing items except the empty state
            Array.from(fileList.children).forEach(child => {
                if (!child.classList.contains('empty-chat-list')) {
                    child.remove();
                }
            });
            // Add files to the list
            data.files.forEach(file => {
                const fileItem = document.createElement('div');
                fileItem.className = 'chat-item slide-in-right';
                fileItem.dataset.fileId = file.file_id;
                fileItem.dataset.fileName = file.filename;
                fileItem.innerHTML = `
                    <div class="chat-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><polyline points="13 2 13 9 20 9"></polyline></svg>
                    </div>
                    <span class="chat-title">${file.filename}</span>
                    <button class="delete-btn">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    </button>
                `;
                // Add click handler for the chat item
                fileItem.addEventListener('click', (e) => {
                    // Don't select file if delete button was clicked
                    if (e.target.closest('.delete-btn')) return;
                    selectFile(file.file_id, file.filename, fileItem);
                });
                // Add delete button handler
                const deleteBtn = fileItem.querySelector('.delete-btn');
                if (deleteBtn) {
                    deleteBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        showDeleteConfirmation(file.file_id, 'single', file.filename);
                    });
                }
                fileList.appendChild(fileItem);
            });
            // Only auto-select a file if selectedFileId is present in localStorage
            const selectedFileId = localStorage.getItem('selectedFileId');
            if (selectedFileId) {
                const selectedItem = fileList.querySelector(`.chat-item[data-file-id="${selectedFileId}"]`);
                if (selectedItem) {
                    selectFile(selectedFileId, localStorage.getItem('selectedFileName'), selectedItem);
                }
            } else {
                // No file selected, show upload UI and hide chat UI
                const uploadContainer = document.getElementById('upload-container');
                const chatContainer = document.getElementById('chat-container');
                if (uploadContainer && chatContainer) {
                    uploadContainer.style.display = 'flex';
                    chatContainer.style.display = 'none';
                }
            }
        } else {
            // No files, show empty state
            if (emptyList) {
                emptyList.style.display = 'flex';
            }
            // Always show upload UI if no files
            const uploadContainer = document.getElementById('upload-container');
            const chatContainer = document.getElementById('chat-container');
            if (uploadContainer && chatContainer) {
                uploadContainer.style.display = 'flex';
                chatContainer.style.display = 'none';
            }
            // Clear file list except the empty state
            Array.from(fileList.children).forEach(child => {
                if (!child.classList.contains('empty-chat-list')) {
                    child.remove();
                }
            });
            // Clear selected file from localStorage
            localStorage.removeItem('selectedFileId');
            localStorage.removeItem('selectedFileName');
        }
    } catch (error) {
        console.error('Error fetching files:', error);
        showToast('Error loading files. Please try again.', true);
    }
}

// Helper function to get file type
function getFileType(filename) {
    const extension = filename.split('.').pop().toLowerCase();
    return extension;
}

// Add this function to app.js to handle memory retrieval and display
async function fetchMemory(fileId) {
    const token = localStorage.getItem('token');
    if (!token || !fileId) return null;
    
    try {
        const response = await fetch(`${API_BASE_URL}/memory/${fileId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            console.log('No memory found or error retrieving memory');
            return null;
        }
        
        const data = await response.json();
        return data.data;
    } catch (error) {
        console.error('Error fetching memory:', error);
        return null;
    }
}

// Convert plain text or lines into readable HTML with bullets and preserved breaks
function formatResponseHtml(response) {
    const raw = Array.isArray(response) ? response.join('\n') : String(response ?? '');
    const normalized = raw.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    const lines = normalized.split('\n');
    const bulletRegex = /^\s*(?:[\u2022\u2023\u25E6\u25CF\u25CB\u25A0\-*]|[0-9]+[.)])\s+(.*)$/; // bullets and 1./1)
    let html = '';
    let inList = false;
    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) {
            if (inList) { html += '</ul>'; inList = false; }
            html += '<br>';
            continue;
        }
        const match = trimmed.match(bulletRegex);
        if (match) {
            if (!inList) { html += '<ul class="ai-bullets">'; inList = true; }
            html += `<li>${escapeHtml(match[1].trim())}</li>`;
        } else {
            if (inList) { html += '</ul>'; inList = false; }
            html += `<p>${escapeHtml(trimmed)}</p>`;
        }
    }
    if (inList) html += '</ul>';
    return html || '<p></p>';
}

// Update the function that handles selecting a file
function selectFile(fileId, fileName, fileItemElement) {
    console.log('Selecting file:', fileId, fileName);
    
    localStorage.setItem('selectedFileId', fileId);
    localStorage.setItem('selectedFileName', fileName);
    
    // Visual selection - Remove active from all items
    document.querySelectorAll('.chat-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Add active class to the selected item
    if (fileItemElement) {
        fileItemElement.classList.add('active');
    }
    
    // Show chat UI, hide upload UI
    const uploadContainer = document.getElementById('upload-container');
    const chatContainer = document.getElementById('chat-container');
    
    if (uploadContainer && chatContainer) {
        uploadContainer.style.display = 'none';
        chatContainer.style.display = 'flex';
    }
    
    // Clear previous chat messages
    const chatMessages = document.getElementById('chat-messages');
    if (chatMessages) {
        chatMessages.innerHTML = '';
        
        // Add initial message
        const welcomeMessage = document.createElement('div');
        welcomeMessage.className = 'message assistant fade-in';
        welcomeMessage.innerHTML = `
            <div class="message-content">
                <p>I've loaded <strong>${fileName}</strong>. What would you like to know about this document?</p>
            </div>
        `;
        chatMessages.appendChild(welcomeMessage);
    }
    
    // Fetch previous memory for this file and add to chat
    fetchMemory(fileId).then(memory => {
        if (memory && memory.context && chatMessages) {
            console.log('Previous conversation found:', memory);
            // If context is an array, show all Q&A pairs
            if (Array.isArray(memory.context)) {
                memory.context.forEach(qa => {
                    if (qa.question && qa.response) {
                        // User question
                        const userMessage = document.createElement('div');
                        userMessage.className = 'message user fade-in';
                        userMessage.innerHTML = `
                            <div class="message-content">
                                <p>${qa.question}</p>
                            </div>
                        `;
                        // Assistant response
                        const assistantMessage = document.createElement('div');
                        assistantMessage.className = 'message assistant fade-in';
                        const responseHtml = formatResponseHtml(qa.response);
                        assistantMessage.innerHTML = `
                            <div class="message-content">${responseHtml}</div>
                            <div class="message-feedback">
                                <button class="feedback-btn thumbs-up" aria-label="Helpful">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path></svg>
                                </button>
                                <button class="feedback-btn thumbs-down" aria-label="Not helpful">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"></path></svg>
                                </button>
                            </div>
                        `;
                        chatMessages.appendChild(userMessage);
                        chatMessages.appendChild(assistantMessage);
                        setupMessageFeedback(assistantMessage);
                    }
                });
            } else if (memory.context.question && memory.context.response) {
                // Fallback: single Q&A
                const userMessage = document.createElement('div');
                userMessage.className = 'message user fade-in';
                userMessage.innerHTML = `
                    <div class="message-content">
                        <p>${memory.context.question}</p>
                    </div>
                `;
                const assistantMessage = document.createElement('div');
                assistantMessage.className = 'message assistant fade-in';
                const responseHtml = formatResponseHtml(memory.context.response);
                assistantMessage.innerHTML = `
                    <div class="message-content">${responseHtml}</div>
                    <div class="message-feedback">
                        <button class="feedback-btn thumbs-up" aria-label="Helpful">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path></svg>
                        </button>
                        <button class="feedback-btn thumbs-down" aria-label="Not helpful">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"></path></svg>
                        </button>
                    </div>
                `;
                chatMessages.appendChild(userMessage);
                chatMessages.appendChild(assistantMessage);
                setupMessageFeedback(assistantMessage);
            }
        }
    });
}

// Setup feedback buttons for messages
function setupMessageFeedback(messageElement) {
    const thumbsUp = messageElement.querySelector('.thumbs-up');
    const thumbsDown = messageElement.querySelector('.thumbs-down');
    
    if (thumbsUp && thumbsDown) {
        thumbsUp.addEventListener('click', () => {
            thumbsUp.classList.add('active');
            thumbsDown.classList.remove('active');
            sendFeedback(true);
        });
        
        thumbsDown.addEventListener('click', () => {
            thumbsDown.classList.add('active');
            thumbsUp.classList.remove('active');
            sendFeedback(false);
        });
    }
}

// Send feedback to the API
async function sendFeedback(isHelpful) {
    const token = localStorage.getItem('token');
    const fileId = localStorage.getItem('selectedFileId');
    
    if (!token || !fileId) return;
    
    try {
        // Generate a unique query ID
        const queryId = `${fileId}_${Date.now()}`;
        
        const response = await fetch(`${API_BASE_URL}/feedback`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                query_id: queryId,
                rating: isHelpful ? 5 : 1,
                feedback_text: "",
                helpful: isHelpful
            })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Failed to submit feedback');
        }
        
        showToast('Thank you for your feedback!');
    } catch (error) {
        console.error('Error submitting feedback:', error);
        showToast('Failed to submit feedback.', true);
    }
}

// Setup upload functionality
function setupUpload() {
    const dropzone = document.getElementById('dropzone');
    const fileInput = document.getElementById('file-input');
    const browseBtn = document.getElementById('browse-files-btn');
    const uploadError = document.getElementById('upload-error');
    
    if (!dropzone || !fileInput || !browseBtn) return;
    
    // Handle click on browse button or dropzone
    browseBtn.addEventListener('click', () => {
        fileInput.click();
    });
    
    dropzone.addEventListener('click', () => {
        fileInput.click();
    });
    
    // Handle file selection
    fileInput.addEventListener('change', () => {
        const file = fileInput.files[0];
        
        if (file) {
            handleFileUpload(file);
        }
    });
    
    // Handle drag and drop
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropzone.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
        });
    });
    
    ['dragenter', 'dragover'].forEach(eventName => {
        dropzone.addEventListener(eventName, () => {
            dropzone.classList.add('active');
        });
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        dropzone.addEventListener(eventName, () => {
            dropzone.classList.remove('active');
        });
    });
    
    dropzone.addEventListener('drop', (e) => {
        const file = e.dataTransfer.files[0];
        
        if (file) {
            handleFileUpload(file);
        }
    });
}

// Handle file upload
async function handleFileUpload(file) {
        const token = localStorage.getItem('token');
    const uploadError = document.getElementById('upload-error');
    const browseBtn = document.getElementById('browse-files-btn');
    
    if (!token || !file) return;
    
    // Check file size
    if (file.size > 5 * 1024 * 1024) {
        uploadError.textContent = 'File size exceeds 5MB limit';
        uploadError.style.display = 'block';
        return;
    }
    
    try {
        uploadError.style.display = 'none';
        
        // Show loading state
        browseBtn.disabled = true;
        browseBtn.textContent = 'Uploading...';
        
            const formData = new FormData();
            formData.append('file', file);
            
            const response = await fetch(`${API_BASE_URL}/upload`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });
            
            const responseText = await response.text();
            // debugger
            let result;
            try {
                console.log('responseText', responseText);
                result = JSON.parse(responseText);
            } catch (e) {
                console.error("Failed to parse JSON response:", e);
                throw new Error("Invalid JSON response from server");
            }
            
            if (!response.ok) {
                throw new Error(result.detail || 'Upload failed');
            }
            
        // Reset file input
        const fileInput = document.getElementById('file-input');
        if (fileInput) fileInput.value = '';
            
            // Show success message
            showToast('File uploaded successfully!');
            
        // Get file information from the upload response
            const fileId = result.data?.file_id || result.file_id;
        const fileName = result.data?.filename || result.filename;
        
            if (fileId) {
            // Refresh the file list from the server
            await fetchFiles();
            // After the file list is refreshed, select the newly uploaded file
            // Find the file item in the DOM and select it
            const fileList = document.getElementById('file-list');
            const fileItem = fileList ? fileList.querySelector(`.chat-item[data-file-id="${fileId}"]`) : null;
            if (fileItem) {
                selectFile(fileId, fileName, fileItem);
            }
        }
        } catch (error) {
        console.error('Upload error:', error);
            uploadError.textContent = error.message;
            uploadError.style.display = 'block';
        } finally {
        browseBtn.disabled = false;
        browseBtn.textContent = 'Browse Files';
        }
}

// Setup query functionality
function setupQuery() {
    const queryBtn = document.getElementById('query-btn');
    const queryInput = document.getElementById('query-input');
    
    if (queryBtn && queryInput) {
        queryBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            sendQuery();
            return false; // Triple protection against form submission
        });
        
        // Also send on Enter key (but allow Shift+Enter for new lines)
        queryInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                e.stopPropagation();
                sendQuery();
                return false; // Triple protection against form submission
            }
        });
    }
}

// Send query to the API
async function sendQuery() {
    const queryInput = document.getElementById('query-input');
    const queryBtn = document.getElementById('query-btn');
    const chatMessages = document.getElementById('chat-messages');
    
    if (!queryInput || !chatMessages) return;
    
    const query = queryInput.value.trim();
    if (!query) return;
    
    const fileId = localStorage.getItem('selectedFileId');
    if (!fileId) {
        showToast('Please select a file first', true);
        return;
    }
        
    const token = localStorage.getItem('token');
    if (!token) {
        showToast('Authentication error. Please login again.', true);
        return;
    }
        
    // Disable input and button
    queryBtn.disabled = true;
    queryInput.disabled = true;
    
    // Add user message to chat
    const userMessage = document.createElement('div');
    userMessage.className = 'message user fade-in';
    userMessage.innerHTML = `
        <div class="message-content">
            <p>${query}</p>
        </div>
    `;
    chatMessages.appendChild(userMessage);
    
    // Add loading message
    const loadingMessage = document.createElement('div');
    loadingMessage.className = 'message assistant fade-in';
    loadingMessage.innerHTML = `
        <div class="message-content">
            <p class="animate-pulse-subtle">Thinking...</p>
        </div>
    `;
    //debugger
    chatMessages.appendChild(loadingMessage);
    
    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    // Clear input
    queryInput.value = '';
    
    console.log('Sending query to API:', query, 'for file:', fileId);
    
    try {
        // Send the query using direct fetch call
        const response = await fetch(`${API_BASE_URL}/query`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                file_id: fileId,
                question: query
            })
        });
            
        const data = await response.json();
        console.log('Query response:', data);
            
        if (!response.ok) {
            throw new Error(data.message || data.detail || 'Query failed');
        }
        
        // Replace loading message with response
        const responseText = data.data?.response || data.answer || "No answer was provided by the system.";
        const responseHtml = formatResponseHtml(responseText);
        
        // Create assistant message
        const assistantMessage = document.createElement('div');
        assistantMessage.className = 'message assistant fade-in';
        assistantMessage.innerHTML = `
            <div class="message-content">${responseHtml}</div>
            <div class="message-feedback">
                <button class="feedback-btn thumbs-up" aria-label="Helpful">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path></svg>
                </button>
                <button class="feedback-btn thumbs-down" aria-label="Not helpful">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"></path></svg>
                </button>
            </div>
        `;
        
        // Remove loading message and add the real response
        if (loadingMessage.parentNode) {
            chatMessages.removeChild(loadingMessage);
        }
        chatMessages.appendChild(assistantMessage);
        
        // Scroll to the new message
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        // Setup feedback button events
        setupMessageFeedback(assistantMessage);
            
    } catch (error) {
        console.error('Query error:', error);
        
        // Replace loading message with error
        const errorMessage = document.createElement('div');
        errorMessage.className = 'message assistant fade-in';
        errorMessage.innerHTML = `
            <div class="message-content">
                <p>Sorry, I couldn't process your request. ${error.message}</p>
            </div>
        `;
        
        // Remove loading message if it exists and is still in DOM
        if (loadingMessage.parentNode) {
            chatMessages.removeChild(loadingMessage);
        }
        
        chatMessages.appendChild(errorMessage);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    } finally {
        // Re-enable input and button
        queryBtn.disabled = false;
        queryInput.disabled = false;
    }
}

// Fetch and display files
function updateQueryForm() {
    // This function is no longer needed with the new UI
    // but kept for compatibility
}

// Setup settings modal functionality
function setupSettingsModal() {
    const settingsBtn = document.getElementById('settings-btn');
    const settingsModal = document.getElementById('settings-modal');
    // New selectors for card system
    const mainCard = settingsModal.querySelector('.settings-step-1');
    const profileCard = document.getElementById('profile-card');
    const chatsCard = document.getElementById('chats-card');
    const openProfileBtn = document.getElementById('open-profile-card');
    const openChatsBtn = document.getElementById('open-chats-card');
    const closeButtons = settingsModal.querySelectorAll('.close');
    const profileForm = document.getElementById('profile-form');
    const deleteAllChatsBtn = document.getElementById('delete-all-chats-btn');

    // Helper to show a card and hide others
    function showCard(card) {
        mainCard.style.display = 'none';
        profileCard.style.display = 'none';
        chatsCard.style.display = 'none';
        profileCard.classList.remove('active');
        chatsCard.classList.remove('active');
        if (card === 'profile') {
            profileCard.style.display = 'block';
            setTimeout(() => profileCard.classList.add('active'), 10);
            loadUserProfile();
        } else if (card === 'chats') {
            chatsCard.style.display = 'block';
            setTimeout(() => chatsCard.classList.add('active'), 10);
            populateSettingsChatList();
        }
    }
    function showMainCard() {
        mainCard.style.display = 'block';
        profileCard.style.display = 'none';
        chatsCard.style.display = 'none';
        profileCard.classList.remove('active');
        chatsCard.classList.remove('active');
    }

    // Open modal when settings button is clicked
    if (settingsBtn && settingsModal) {
        settingsBtn.addEventListener('click', () => {
            settingsModal.style.display = 'block';
            showMainCard();
        });
    }

    // Open profile card
    if (openProfileBtn) {
        openProfileBtn.addEventListener('click', () => {
            showCard('profile');
        });
    }
    // Open chats card
    if (openChatsBtn) {
        openChatsBtn.addEventListener('click', () => {
            showCard('chats');
        });
    }

    // Close modal or return to main card
    if (closeButtons) {
        closeButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                // If in a sub-card, go back to main card, else close modal
                if (profileCard.classList.contains('active') || chatsCard.classList.contains('active')) {
                    showMainCard();
                } else {
                    settingsModal.style.display = 'none';
                }
            });
        });
    }

    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === settingsModal) {
            settingsModal.style.display = 'none';
        }
    });

    // Handle profile form submission
    if (profileForm) {
        profileForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const name = document.getElementById('name').value;
            const username = document.getElementById('username').value;
            const email = document.getElementById('email').value;
            const currentPassword = document.getElementById('current-password').value;
            const newPassword = document.getElementById('new-password').value;
            const errorMsg = document.getElementById('profile-error');
            
            // Reset error
            errorMsg.style.display = 'none';
            
            // Prepare request data - only include fields that have values
            const updateData = {};
            if (name) updateData.name = name;
            if (username) updateData.username = username;
            if (email) updateData.email = email;
            if (currentPassword) updateData.current_password = currentPassword;
            if (newPassword) updateData.new_password = newPassword;
            
            try {
                const token = localStorage.getItem('token');
                if (!token) throw new Error('Authentication required');
                
                const response = await fetch(`${API_BASE_URL}/profile`, {
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
                
                // Update username in localStorage if it was changed
                if (updateData.username) {
                    localStorage.setItem('username', updateData.username);
                }
                
                showToast('Profile updated successfully');
                
                // Close the modal
                settingsModal.style.display = 'none';
                
            } catch (error) {
                console.error('Error updating profile:', error);
                errorMsg.textContent = error.message;
                errorMsg.style.display = 'block';
            }
        });
    }
    
    // Handle delete all chats button
    if (deleteAllChatsBtn) {
        deleteAllChatsBtn.addEventListener('click', () => {
            // Show confirmation modal with special action for delete all
            showDeleteConfirmation(null, 'all');
        });
    }
}

// Load user profile data
async function loadUserProfile() {
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');
    
    if (!token || !userId) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/user/${userId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch user data');
        }
        
        const userData = await response.json();
        
        // Populate form fields
        document.getElementById('name').value = userData.name || '';
        document.getElementById('username').value = userData.username || '';
        document.getElementById('email').value = userData.email || '';
        
    } catch (error) {
        console.error('Error fetching user profile:', error);
        showToast('Failed to load profile data', true);
    }
}

// Populate the chat list in settings
function populateSettingsChatList() {
    const chatList = document.getElementById('settings-chat-list');
    const token = localStorage.getItem('token');
    
    if (!chatList || !token) return;
    
    // Clear previous items except empty message
    const emptyMessage = chatList.querySelector('.empty-list-message');
    chatList.innerHTML = '';
    chatList.appendChild(emptyMessage);
    
    // Fetch files/chats and populate the list
    fetch(`${API_BASE_URL}/files`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.files && data.files.length > 0) {
            emptyMessage.style.display = 'none';
            
            data.files.forEach(file => {
                const fileItem = document.createElement('div');
                fileItem.className = 'settings-chat-item';
                fileItem.dataset.fileId = file.file_id;
                
                fileItem.innerHTML = `
                    <div class="chat-info">
                        <div class="chat-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><polyline points="13 2 13 9 20 9"></polyline></svg>
                        </div>
                        <span class="chat-title">${file.filename}</span>
                    </div>
                    <button class="delete-chat-btn" aria-label="Delete chat">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    </button>
                `;
                
                // Add delete button functionality
                const deleteBtn = fileItem.querySelector('.delete-chat-btn');
                deleteBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    showDeleteConfirmation(file.file_id, 'single', file.filename);
                });
                
                chatList.appendChild(fileItem);
            });
        } else {
            emptyMessage.style.display = 'block';
        }
    })
    .catch(error => {
        console.error('Error fetching files for settings:', error);
        showToast('Error loading files', true);
    });
}

// Setup delete confirmation modal
function setupDeleteConfirmModal() {
    const modal = document.getElementById('delete-confirm-modal');
    const closeBtn = modal.querySelector('.close');
    const cancelBtn = document.getElementById('cancel-delete-btn');
    
    // Close modal functions
    const closeModal = () => {
        modal.style.display = 'none';
        // Clear any stored file ID
        modal.dataset.fileId = '';
        modal.dataset.deleteType = '';
    };
    
    // Close when X is clicked
    if (closeBtn) {
        closeBtn.addEventListener('click', closeModal);
    }
    
    // Close when Cancel is clicked
    if (cancelBtn) {
        cancelBtn.addEventListener('click', closeModal);
    }
    
    // Close when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });
    
    // Setup confirm delete button
    const confirmBtn = document.getElementById('confirm-delete-btn');
    if (confirmBtn) {
        confirmBtn.addEventListener('click', async () => {
            const fileId = modal.dataset.fileId;
            const deleteType = modal.dataset.deleteType;
            
            try {
                const token = localStorage.getItem('token');
                if (!token) throw new Error('Authentication required');
                
                if (deleteType === 'all') {
                    // Delete all chats - this would need a backend endpoint
                    const files = await fetchAllFiles();
                    
                    if (files && files.length > 0) {
                        // Delete each file
                        for (const file of files) {
                            await deleteFile(file.file_id);
                        }
                        
                        showToast('All chats deleted successfully');
                    } else {
                        showToast('No chats to delete');
                    }
                } else if (deleteType === 'single' && fileId) {
                    // Delete single chat/file
                    await deleteFile(fileId);
                    showToast('Chat deleted successfully');
                }
                
                // Refresh files list
                fetchFiles();
                
                // Also refresh the settings chat list if the settings modal is open
                if (document.getElementById('settings-modal').style.display === 'block') {
                    populateSettingsChatList();
                }
                
                // Clear selected file if it was deleted
                const selectedFileId = localStorage.getItem('selectedFileId');
                if (selectedFileId === fileId || deleteType === 'all') {
                    localStorage.removeItem('selectedFileId');
                    localStorage.removeItem('selectedFileName');
                    
                    // Show upload UI, hide chat UI
                    const uploadContainer = document.getElementById('upload-container');
                    const chatContainer = document.getElementById('chat-container');
                    
                    if (uploadContainer && chatContainer) {
                        uploadContainer.style.display = 'flex';
                        chatContainer.style.display = 'none';
                    }
                }
                
                // Close the modal
                closeModal();
                
            } catch (error) {
                console.error('Error deleting chat(s):', error);
                showToast('Failed to delete chat(s)', true);
            }
        });
    }
}

// Show delete confirmation modal
function showDeleteConfirmation(fileId, type = 'single', fileName = '') {
    const modal = document.getElementById('delete-confirm-modal');
    const messageText = modal.querySelector('p');
    
    if (!modal) return;
    
    // Set the file ID and delete type in the modal's dataset
    modal.dataset.fileId = fileId || '';
    modal.dataset.deleteType = type;
    
    // Update message based on type
    if (type === 'all') {
        messageText.textContent = 'Are you sure you want to delete ALL chats? This action cannot be undone.';
    } else {
        messageText.textContent = `Are you sure you want to delete the chat "${fileName}"? This action cannot be undone.`;
    }
    
    // Show the modal
    modal.style.display = 'block';
}

// Delete a file by ID
async function deleteFile(fileId) {
    const token = localStorage.getItem('token');
    if (!token || !fileId) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/files/${fileId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || 'Failed to delete file');
        }
        
        return true;
    } catch (error) {
        console.error('Error deleting file:', error);
        throw error;
    }
}

// Fetch all files (helper for delete all)
async function fetchAllFiles() {
    const token = localStorage.getItem('token');
    if (!token) return [];
    
    try {
        const response = await fetch(`${API_BASE_URL}/files`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch files');
        }
        
        const data = await response.json();
        return data.files || [];
    } catch (error) {
        console.error('Error fetching all files:', error);
        return [];
    }
}

// Add context menu to chat items
function addChatItemContextMenu() {
    const chatItems = document.querySelectorAll('.chat-item');
    
    chatItems.forEach(item => {
        // Add right-click event listener
        item.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            
            const fileId = item.dataset.fileId;
            const fileName = item.dataset.fileName;
            
            // Show delete confirmation
            showDeleteConfirmation(fileId, 'single', fileName);
        });
        
        // Add delete button to chat items
        if (!item.querySelector('.delete-btn')) {
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-btn';
            deleteBtn.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            `;
            
            // Add click event to delete button
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                showDeleteConfirmation(fileId, 'single', fileName);
            });
            
            item.appendChild(deleteBtn);
        }
    });
}

// ===== DOCUMENT TAB LOGIC =====
function setupDocumentTab() {
    const docTabBtn = document.querySelector('.tab-btn[data-tab="document"]');
    const docFileList = document.getElementById('document-file-list');
    if (!docTabBtn || !docFileList) return;

    docTabBtn.addEventListener('click', async () => {
        await renderDocumentFileList();
    });

    // Setup close button for document preview modal
    const closeBtn = document.getElementById('close-document-preview');
    const previewModal = document.getElementById('document-preview-modal');
    if (closeBtn && previewModal) {
        closeBtn.addEventListener('click', () => {
            previewModal.classList.remove('active');
            document.body.classList.remove('modal-open');
            // Optionally clear preview content
            const docPreview = document.getElementById('document-preview');
            if (docPreview) docPreview.innerHTML = '<div class="document-placeholder fire-animate"><p>Select a file to view its content</p></div>';
            // Re-enable file list
            document.querySelectorAll('.doc-file-item').forEach(i => i.classList.remove('disabled', 'active'));
        });
    }
}

async function renderDocumentFileList() {
    const token = localStorage.getItem('token');
    const docFileList = document.getElementById('document-file-list');
    if (!token || !docFileList) return;
    docFileList.innerHTML = '<div style="padding:32px;color:#64748b;">Loading files...</div>';
    try {
        const response = await fetch(`${API_BASE_URL}/files`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (data.files && data.files.length > 0) {
            docFileList.innerHTML = '';
            data.files.forEach((file, idx) => {
                const item = document.createElement('div');
                item.className = 'doc-file-item cool-animate';
                item.innerHTML = `
                    <span class="doc-file-icon">${getDocFileIcon(file.filename)}</span>
                    <div class="doc-file-meta">
                        <span class="doc-file-name">${file.filename}</span>
                        <span class="doc-file-date">${formatDate(file.upload_date)}</span>
                    </div>
                `;
                item.addEventListener('click', () => {
                    if (item.classList.contains('disabled')) return;
                    // Show modal overlay for preview
                    const previewModal = document.getElementById('document-preview-modal');
                    if (previewModal) {
                        previewModal.classList.add('active');
                        document.body.classList.add('modal-open');
                        // Only one preview at a time, so disable all file items
                        document.querySelectorAll('.doc-file-item').forEach(i => {
                            i.classList.remove('active');
                            if (i !== item) i.classList.add('disabled');
                        });
                        item.classList.add('active');
                        renderDocumentPreview(file);
                    }
                });
                docFileList.appendChild(item);
            });
            // Show placeholder in preview modal if nothing selected
            const docPreview = document.getElementById('document-preview');
            if (docPreview) docPreview.innerHTML = '<div class="document-placeholder fire-animate"><p>Select a file to view its content</p></div>';
        } else {
            docFileList.innerHTML = '<div style="padding:32px;color:#64748b;">No files uploaded yet.</div>';
            const docPreview = document.getElementById('document-preview');
            if (docPreview) docPreview.innerHTML = '<div class="document-placeholder fire-animate"><p>Upload a file to view it here</p></div>';
        }
    } catch (err) {
        docFileList.innerHTML = '<div style="padding:32px;color:#ef4444;">Error loading files</div>';
    }
}

function getDocFileIcon(filename) {
    const ext = filename.split('.').pop().toLowerCase();
    if (["pdf"].includes(ext)) return '📄';
    if (["txt","md"].includes(ext)) return '📝';
    if (["csv","xls","xlsx"].includes(ext)) return '📊';
    if (["doc","docx"].includes(ext)) return '📃';
    return '📁';
}

function formatDate(ts) {
    if (!ts) return '';
    const d = new Date(ts * 1000);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
}

async function renderDocumentPreview(file) {
    const token = localStorage.getItem('token');
    const docPreview = document.getElementById('document-preview');
    if (!token || !docPreview) return;
    docPreview.innerHTML = '<div class="document-placeholder fire-animate">Loading preview...</div>';
    const ext = file.filename.split('.').pop().toLowerCase();
    const fileUrl = `${API_BASE_URL}/files/${file.file_id}/public_view?token=${encodeURIComponent(token)}`;
    if (ext === 'pdf') {
        docPreview.innerHTML = `<iframe class="cool-iframe" src="${fileUrl}" style="min-height:60vh;"></iframe>`;
    } else if (['txt','csv','md'].includes(ext)) {
        try {
            const resp = await fetch(fileUrl, { headers: { 'Authorization': `Bearer ${token}` } });
            if (!resp.ok) throw new Error('Failed to load file');
            const text = await resp.text();
            docPreview.innerHTML = `<pre class="cool-pre">${escapeHtml(text)}</pre>`;
        } catch (e) {
            docPreview.innerHTML = `<div class="document-placeholder fire-animate">Could not load file content.</div>`;
        }
    } else {
        docPreview.innerHTML = `<div class="document-placeholder fire-animate">Preview not supported.<br><a class="download-link" href="${fileUrl}" target="_blank">Download file</a></div>`;
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.innerText = text;
    return div.innerHTML;
}
