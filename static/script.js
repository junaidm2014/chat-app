const ws = new WebSocket(`ws://localhost:8000/ws/${Math.random()}`);
const messages = document.getElementById('messages');

ws.onmessage = function(event) {
    const message = JSON.parse(event.data);
    const messageElement = document.createElement('div');
    messageElement.className = 'message';
    messageElement.innerHTML = `
        <strong>${message.username}:</strong> ${message.message} 
        <small>(${new Date(message.timestamp).toLocaleTimeString()})</small>
    `;
    messages.appendChild(messageElement);
    messages.scrollTop = messages.scrollHeight;
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

function sendMessage() {
    const username = document.getElementById('username').value;
    const message = document.getElementById('messageText').value;
    
    if (username && message) {
        ws.send(JSON.stringify({
            username: username,
            message: message,
            room: "general"
        }));
        document.getElementById('messageText').value = '';
    } else {
        alert('Please enter both username and message');
    }
}

document.getElementById('messageText').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        sendMessage();
    }
});

document.getElementById('username').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        document.getElementById('messageText').focus();
    }
});