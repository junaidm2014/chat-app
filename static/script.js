// document.getElementById('messageText').addEventListener('keypress', function(e) {
// document.getElementById('username').addEventListener('keypress', function(e) {


let ws = null;
let currentUserId = null;
let onlineUsers = [];
let privateTabs = new Set(); // Track open private conversations
let activeTab = 'public';
let publicMessages = [];
let privateMessages = {}; // { userId: [msg, ...] }

function signIn() {
    const userId = document.getElementById('userIdInput').value.trim();
    if (!userId) {
        alert('Please enter a User ID');
        return;
    }
    currentUserId = userId;
    document.getElementById('signin-container').style.display = 'none';
    document.getElementById('chat-container').style.display = '';
    document.getElementById('currentUser').textContent = `Signed in as: ${userId}`;
    
    // Get the current host and protocol, replace http with ws
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host; // includes port if present
    ws = new WebSocket(`${protocol}//${host}/ws/${userId}`);
    setupWebSocket();
}

function setupWebSocket() {
    ws.onmessage = function(event) {
        const message = JSON.parse(event.data);
        if (message.type === 'user_list') {
            updateUserList(message.users);
        } else if (message.private) {
            showPrivateMessage(message);
        } else {
            showPublicMessage(message);
        }
    };

    ws.onopen = function(event) {
        console.log('Connected to chat server');
    };

    ws.onclose = function(event) {
        console.log('Disconnected from chat server');
    };

    ws.onerror = function(error) {
        console.error('WebSocket error:', error);
    };
}

function updateUserList(users) {
    onlineUsers = users.filter(u => u !== currentUserId);
    const userListElem = document.getElementById('user-list');
    userListElem.innerHTML = '';
    const recipientSelect = document.getElementById('recipientSelect');
    recipientSelect.innerHTML = '<option value="">Public (Everyone)</option>';
    onlineUsers.forEach(user => {
        const li = document.createElement('li');
        li.textContent = user;
        li.style.cursor = 'pointer';
        li.onclick = () => openPrivateChat(user);
        userListElem.appendChild(li);
        const opt = document.createElement('option');
        opt.value = user;
        opt.textContent = `Private: ${user}`;
        recipientSelect.appendChild(opt);
    });
}

function openPrivateChat(userId) {
    console.log('Opening private chat with:', userId);
    if (!privateTabs.has(userId)) {
        console.log('Creating new tab for:', userId);
        createPrivateTab(userId);
    }
    console.log('Switching to tab:', `private-${userId}`);
    switchTab(`private-${userId}`);
}



function showPublicMessage(message) {
    message.localTimestamp = Date.now();
    publicMessages.push(message);
    if (activeTab === 'public') {
        renderPublicMessages();
    }
}

function renderPublicMessages() {
    const messages = document.getElementById('messages');
    if (messages) {
        messages.innerHTML = '';
        publicMessages.forEach(msg => {
            const messageElement = document.createElement('div');
            messageElement.className = 'message';
            const ts = msg.localTimestamp ? msg.localTimestamp : msg.timestamp;
            messageElement.innerHTML = `
                <strong>${msg.username}:</strong> ${msg.message} 
                <small>(${new Date(ts).toLocaleTimeString()})</small>
            `;
            messages.appendChild(messageElement);
        });
        messages.scrollTop = messages.scrollHeight;
    }
}


function showPrivateMessage(message) {
    let otherUser;
    if (message.username === currentUserId) {
        otherUser = message.recipient;
    } else {
        otherUser = message.username;
    }
    if (!otherUser || otherUser === currentUserId) {
        return;
    }
    message.localTimestamp = Date.now();
    if (!privateMessages[otherUser]) {
        privateMessages[otherUser] = [];
    }
    privateMessages[otherUser].push(message);
    if (activeTab === `private-${otherUser}`) {
        renderPrivateMessages(otherUser);
    }
    if (!privateTabs.has(otherUser)) {
        createPrivateTab(otherUser);
    }
}

function renderPrivateMessages(userId) {
    const tabId = `private-${userId}`;
    const tabPane = document.getElementById(tabId);
    const messagesContainer = tabPane ? tabPane.querySelector('.message-area') : null;
    if (messagesContainer) {
        messagesContainer.innerHTML = '';
        privateMessages[userId].forEach(msg => {
            const messageElement = document.createElement('div');
            messageElement.className = 'message';
            const ts = msg.localTimestamp ? msg.localTimestamp : msg.timestamp;
            messageElement.innerHTML = `
                <strong>${msg.username}:</strong> ${msg.message} 
                <small>(${new Date(ts).toLocaleTimeString()})</small>
            `;
            messagesContainer.appendChild(messageElement);
        });
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
}

function createPrivateTab(userId) {
    privateTabs.add(userId);
    
    // Create tab button
    const tabsContainer = document.getElementById('chat-tabs');
    const tabButton = document.createElement('button');
    tabButton.className = 'tab-button';
    tabButton.onclick = () => switchTab(`private-${userId}`);
    tabButton.innerHTML = `${userId} <span class="close-tab" onclick="closeTab('${userId}', event)">×</span>`;
    tabsContainer.appendChild(tabButton);
    
    // Create tab content
    const tabContent = document.getElementById('tab-content');
    const tabPane = document.createElement('div');
    tabPane.id = `private-${userId}`;
    tabPane.className = 'tab-pane';
    tabPane.innerHTML = `<div class="message-area"></div>`;
    tabContent.appendChild(tabPane);
}

function switchTab(tabId) {
    activeTab = tabId;
    // Update tab buttons
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.remove('active');
        btn.classList.remove('inactive');
        if ((tabId === 'public' && btn.textContent.includes('Public Chat')) ||
            (tabId.startsWith('private-') && btn.textContent.includes(tabId.replace('private-', '')))) {
            btn.classList.add('active');
        } else {
            btn.classList.add('inactive');
        }
    });
    // Update tab content
    document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));
    const targetPane = document.getElementById(tabId);
    if (targetPane) {
        targetPane.classList.add('active');
    }
    // Render messages for the active tab
    if (tabId === 'public') {
        renderPublicMessages();
        const recipientSelect = document.getElementById('recipientSelect');
        recipientSelect.value = '';
    } else {
        const userId = tabId.replace('private-', '');
        renderPrivateMessages(userId);
        const recipientSelect = document.getElementById('recipientSelect');
        recipientSelect.value = userId;
    }
}

function closeTab(userId, event) {
    event.stopPropagation();
    privateTabs.delete(userId);
    
    // Remove tab button and content
    document.querySelector(`button[onclick*="${userId}"]`).remove();
    document.getElementById(`private-${userId}`).remove();
    
    // Switch to public tab if closing active tab
    if (activeTab === `private-${userId}`) {
        switchTab('public');
    }
}

function getRecipientFromMessage(message) {
    return message.recipient;
}

// Fix the switchTab function to work properly

function switchTab(tabId) {
    activeTab = tabId;
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.remove('active');
        btn.classList.remove('inactive');
        // Set inactive style for all except active
        if ((tabId === 'public' && btn.textContent.includes('Public Chat')) ||
            (tabId.startsWith('private-') && btn.textContent.includes(tabId.replace('private-', '')))) {
            btn.classList.add('active');
        } else {
            btn.classList.add('inactive');
        }
    });
    document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));
    const targetPane = document.getElementById(tabId);
    if (targetPane) {
        targetPane.classList.add('active');
    }
    // Re-render messages for the active tab
    if (tabId === 'public') {
        renderPublicMessages();
        const recipientSelect = document.getElementById('recipientSelect');
        recipientSelect.value = '';
    } else {
        const userId = tabId.replace('private-', '');
        renderPrivateMessages(userId);
        const recipientSelect = document.getElementById('recipientSelect');
        recipientSelect.value = userId;
    }
}

function closeTab(userId, event) {
    event.stopPropagation();
    privateTabs.delete(userId);
    
    // Remove tab button and content
    const buttons = document.querySelectorAll('.tab-button');
    buttons.forEach(btn => {
        if (btn.textContent.includes(userId) && !btn.textContent.includes('Public')) {
            btn.remove();
        }
    });
    
    const tabPane = document.getElementById(`private-${userId}`);
    if (tabPane) {
        tabPane.remove();
    }
    
    // Switch to public tab if closing active tab
    if (activeTab === `private-${userId}`) {
        switchTab('public');
    }
}

function sendMessage() {
    const message = document.getElementById('messageText').value;
    const recipient = document.getElementById('recipientSelect').value;
    if (!currentUserId || !message) {
        alert('Please sign in and enter a message');
        return;
    }
    const payload = {
        username: currentUserId,
        message: message,
        room: "general"
    };
    if (recipient) {
        payload.recipient = recipient;
    }
    ws.send(JSON.stringify(payload));
    document.getElementById('messageText').value = '';
}

document.getElementById('messageText').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        sendMessage();
    }
});