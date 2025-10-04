// document.getElementById('messageText').addEventListener('keypress', function(e) {
// document.getElementById('username').addEventListener('keypress', function(e) {

let ws = null;
let currentUserId = null;
let onlineUsers = [];

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
    ws = new WebSocket(`ws://localhost:8000/ws/${userId}`);
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
        userListElem.appendChild(li);
        const opt = document.createElement('option');
        opt.value = user;
        opt.textContent = `Private: ${user}`;
        recipientSelect.appendChild(opt);
    });
}

function showPublicMessage(message) {
    const messages = document.getElementById('messages');
    const messageElement = document.createElement('div');
    messageElement.className = 'message';
    messageElement.innerHTML = `
        <strong>${message.username}:</strong> ${message.message} 
        <small>(${new Date(message.timestamp).toLocaleTimeString()})</small>
    `;
    messages.appendChild(messageElement);
    messages.scrollTop = messages.scrollHeight;
}

function showPrivateMessage(message) {
    document.getElementById('private-messages-container').style.display = '';
    const privateMessages = document.getElementById('private-messages');
    const messageElement = document.createElement('div');
    messageElement.className = 'message';
    messageElement.innerHTML = `
        <strong>${message.username} (private):</strong> ${message.message} 
        <small>(${new Date(message.timestamp).toLocaleTimeString()})</small>
    `;
    privateMessages.appendChild(messageElement);
    privateMessages.scrollTop = privateMessages.scrollHeight;
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