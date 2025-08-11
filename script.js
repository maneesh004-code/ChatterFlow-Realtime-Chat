// ===================================
// CHAT APPLICATION - MAIN SCRIPT
// ===================================

// App State Variables
let currentUser = null;
let currentRoom = null;
let messages = {};
let rooms = [
    { id: 'general', name: 'General', description: 'General discussion', users: [] },
    { id: 'random', name: 'Random', description: 'Random conversations', users: [] },
    { id: 'tech', name: 'Tech Talk', description: 'Technology discussions', users: [] },
    { id: 'gaming', name: 'Gaming', description: 'Gaming community', users: [] }
];
let onlineUsers = new Set();
let typingUsers = new Set();
let typingTimeout = null;

// Initialize messages for each room
rooms.forEach(room => {
    messages[room.id] = [];
});

// ===================================
// AUTHENTICATION FUNCTIONS
// ===================================

/**
 * Handle user login
 */
function login() {
    const username = document.getElementById('usernameInput').value.trim();
    
    // Validate username
    if (!username) {
        alert('Please enter a username');
        return;
    }
    
    if (username.length < 2) {
        alert('Username must be at least 2 characters long');
        return;
    }

    // Set current user
    currentUser = username;
    onlineUsers.add(username);
    
    // Update UI elements
    document.getElementById('currentUsername').textContent = username;
    document.getElementById('userAvatar').textContent = username.charAt(0).toUpperCase();
    document.getElementById('loginScreen').style.display = 'none';
    
    // Add user to all rooms
    rooms.forEach(room => {
        if (!room.users.includes(username)) {
            room.users.push(username);
        }
    });
    
    // Initialize UI
    renderRooms();
    
    // Add welcome message to general room
    addSystemMessage('general', `${username} joined the chat!`);
    
    console.log(`User ${username} logged in successfully`);
}

/**
 * Handle user logout
 */
function logout() {
    if (currentUser) {
        onlineUsers.delete(currentUser);
        
        // Add goodbye message if in a room
        if (currentRoom) {
            addSystemMessage(currentRoom, `${currentUser} left the chat!`);
        }
        
        // Remove user from all rooms
        rooms.forEach(room => {
            const userIndex = room.users.indexOf(currentUser);
            if (userIndex > -1) {
                room.users.splice(userIndex, 1);
            }
        });
    }
    
    // Reset state
    currentUser = null;
    currentRoom = null;
    
    // Reset UI
    document.getElementById('loginScreen').style.display = 'flex';
    document.getElementById('usernameInput').value = '';
    document.getElementById('welcomeScreen').classList.remove('hidden');
    document.getElementById('chatInterface').classList.add('hidden');
    
    // Clear typing indicator
    hideTypingIndicator();
    
    console.log('User logged out successfully');
}

// ===================================
// ROOM MANAGEMENT FUNCTIONS
// ===================================

/**
 * Render rooms in the sidebar
 */
function renderRooms() {
    const roomList = document.getElementById('roomList');
    roomList.innerHTML = '';
    
    rooms.forEach(room => {
        const roomElement = document.createElement('div');
        roomElement.className = 'room-item';
        roomElement.onclick = () => selectRoom(room.id);
        
        // Highlight active room
        if (room.id === currentRoom) {
            roomElement.classList.add('active');
        }
        
        // Create room HTML
        roomElement.innerHTML = `
            <div class="room-icon">${room.name.charAt(0)}</div>
            <div class="room-info">
                <h3>${room.name}</h3>
                <p>${room.users.length} members</p>
            </div>
        `;
        
        roomList.appendChild(roomElement);
    });
}

/**
 * Select and switch to a room
 */
function selectRoom(roomId) {
    const room = rooms.find(r => r.id === roomId);
    if (!room) {
        console.error(`Room ${roomId} not found`);
        return;
    }
    
    // Set current room
    currentRoom = roomId;
    
    // Update chat header
    document.getElementById('welcomeScreen').classList.add('hidden');
    document.getElementById('chatInterface').classList.remove('hidden');
    document.getElementById('chatRoomName').textContent = room.name;
    document.getElementById('chatRoomInfo').textContent = `${room.users.length} members • ${room.description}`;
    document.getElementById('chatAvatar').textContent = room.name.charAt(0);
    
    // Update sidebar
    renderRooms();
    
    // Load and display messages
    renderMessages();
    
    // Focus message input
    document.getElementById('messageInput').focus();
    
    console.log(`Switched to room: ${room.name}`);
}

// ===================================
// MESSAGE FUNCTIONS
// ===================================

/**
 * Render all messages in current room
 */
function renderMessages() {
    const container = document.getElementById('messagesContainer');
    container.innerHTML = '';
    
    if (!currentRoom || !messages[currentRoom]) return;
    
    // Create message elements
    messages[currentRoom].forEach(message => {
        const messageElement = createMessageElement(message);
        container.appendChild(messageElement);
    });
    
    // Auto-scroll to bottom
    scrollToBottom();
}

/**
 * Create a single message element
 */
function createMessageElement(message) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${message.username === currentUser ? 'own' : 'other'}`;
    
    if (message.type === 'system') {
        // System message styling
        messageDiv.style.alignSelf = 'center';
        messageDiv.style.background = 'rgba(149, 165, 166, 0.2)';
        messageDiv.style.color = '#7f8c8d';
        messageDiv.style.fontSize = '12px';
        messageDiv.style.fontStyle = 'italic';
        messageDiv.style.maxWidth = '80%';
        messageDiv.innerHTML = `<p class="message-content">${message.content}</p>`;
    } else {
        // Regular user message
        messageDiv.innerHTML = `
            <p class="message-content">${escapeHtml(message.content)}</p>
            <div class="message-info">
                <span>${escapeHtml(message.username)}</span>
                <span>${formatTime(message.timestamp)}</span>
            </div>
        `;
    }
    
    return messageDiv;
}

/**
 * Send a new message
 */
function sendMessage() {
    const input = document.getElementById('messageInput');
    const content = input.value.trim();
    
    // Validate input
    if (!content || !currentRoom || !currentUser) return;
    
    // Create message object
    const message = {
        id: Date.now(),
        username: currentUser,
        content: content,
        timestamp: new Date(),
        room: currentRoom,
        type: 'user'
    };
    
    // Add to messages array
    if (!messages[currentRoom]) {
        messages[currentRoom] = [];
    }
    messages[currentRoom].push(message);
    
    // Clear input
    input.value = '';
    
    // Stop typing indicator
    clearTimeout(typingTimeout);
    hideTypingIndicator();
    
    // Update UI
    renderMessages();
    
    // Simulate responses from other users (for demo)
    setTimeout(() => {
        simulateResponse();
    }, 1000 + Math.random() * 2000);
    
    console.log(`Message sent: ${content}`);
}

/**
 * Add system message (user join/leave notifications)
 */
function addSystemMessage(roomId, content) {
    if (!roomId || !messages[roomId]) return;
    
    const message = {
        id: Date.now(),
        content: content,
        timestamp: new Date(),
        room: roomId,
        type: 'system'
    };
    
    messages[roomId].push(message);
    
    // Update UI if currently in this room
    if (currentRoom === roomId) {
        renderMessages();
    }
}

// ===================================
// TYPING INDICATOR FUNCTIONS
// ===================================

/**
 * Show typing indicator
 */
function showTypingIndicator(text) {
    const indicator = document.getElementById('typingIndicator');
    indicator.textContent = text || 'Someone is typing...';
    indicator.classList.remove('hidden');
}

/**
 * Hide typing indicator
 */
function hideTypingIndicator() {
    document.getElementById('typingIndicator').classList.add('hidden');
}

// ===================================
// SIMULATION FUNCTIONS (FOR DEMO)
// ===================================

/**
 * Simulate responses from other users
 */
function simulateResponse() {
    if (!currentRoom) return;
    
    const responses = [
        "That's interesting!",
        "I agree with you on that",
        "Great point!",
        "Thanks for sharing",
        "LOL 😂",
        "What do you think about that?",
        "I see what you mean",
        "That makes sense",
        "Cool! Tell me more",
        "Absolutely!",
        "Nice one!",
        "Totally agree",
        "Good question",
        "That's awesome!",
        "Makes perfect sense"
    ];
    
    const usernames = ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve', 'Frank', 'Grace', 'Henry'];
    const randomUser = usernames[Math.floor(Math.random() * usernames.length)];
    const randomResponse = responses[Math.floor(Math.random() * responses.length)];
    
    // Show typing indicator first
    showTypingIndicator(`${randomUser} is typing...`);
    
    setTimeout(() => {
        hideTypingIndicator();
        
        // Create and add response message
        const message = {
            id: Date.now(),
            username: randomUser,
            content: randomResponse,
            timestamp: new Date(),
            room: currentRoom,
            type: 'user'
        };
        
        messages[currentRoom].push(message);
        renderMessages();
    }, 1000 + Math.random() * 2000);
}

// ===================================
// UTILITY FUNCTIONS
// ===================================

/**
 * Format timestamp for display
 */
function formatTime(timestamp) {
    return new Date(timestamp).toLocaleTimeString([], {
        hour: '2-digit', 
        minute: '2-digit'
    });
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Scroll messages container to bottom
 */
function scrollToBottom() {
    const container = document.getElementById('messagesContainer');
    container.scrollTop = container.scrollHeight;
}

// ===================================
// EVENT LISTENERS
// ===================================

/**
 * Set up all event listeners when DOM is loaded
 */
document.addEventListener('DOMContentLoaded', function() {
    console.log('Chat application initialized');
    
    // Message input - Enter key to send
    document.getElementById('messageInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
    
    // Typing indicator functionality
    document.getElementById('messageInput').addEventListener('input', function() {
        clearTimeout(typingTimeout);
        
        if (this.value.trim() && currentRoom) {
            // Show typing indicator (in real app, this would broadcast to other users)
            typingTimeout = setTimeout(() => {
                // Hide typing after 2 seconds of inactivity
            }, 2000);
        }
    });
    
    // Username input - Enter key to login
    document.getElementById('usernameInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            login();
        }
    });
    
    // Focus username input on page load
    document.getElementById('usernameInput').focus();
    
    // Initialize sample messages for demo
    initializeSampleMessages();
});

/**
 * Initialize sample messages for demonstration
 */
function initializeSampleMessages() {
    // Add sample messages to different rooms
    messages['general'].push({
        id: 1,
        username: 'ChatBot',
        content: 'Welcome to the General chat room! Feel free to introduce yourself.',
        timestamp: new Date(Date.now() - 60000),
        room: 'general',
        type: 'user'
    });
    
    messages['tech'].push({
        id: 2,
        username: 'TechGuru',
        content: 'Anyone working on interesting projects lately?',
        timestamp: new Date(Date.now() - 120000),
        room: 'tech',
        type: 'user'
    });
    
    messages['gaming'].push({
        id: 3,
        username: 'GameMaster',
        content: 'What games is everyone playing this week?',
        timestamp: new Date(Date.now() - 180000),
        room: 'gaming',
        type: 'user'
    });
    
    messages['random'].push({
        id: 4,
        username: 'RandomUser',
        content: 'Did you know that octopuses have three hearts? 🐙',
        timestamp: new Date(Date.now() - 240000),
        room: 'random',
        type: 'user'
    });
}

// ===================================
// WINDOW EVENT HANDLERS
// ===================================

// Handle page visibility change (pause/resume functionality)
document.addEventListener('visibilitychange', function() {
    if (document.hidden) {
        console.log('Application paused');
    } else {
        console.log('Application resumed');
        // In a real app, you might want to refresh messages here
    }
});

// Handle window resize for responsive behavior
window.addEventListener('resize', function() {
    // Auto-scroll to bottom after resize to maintain message view
    if (currentRoom) {
        setTimeout(() => {
            scrollToBottom();
        }, 100);
    }
});

// Handle keyboard shortcuts
document.addEventListener('keydown', function(e) {
    // ESC key to close mobile sidebar (if implemented)
    if (e.key === 'Escape') {
        const sidebar = document.getElementById('sidebar');
        if (sidebar.classList.contains('open')) {
            sidebar.classList.remove('open');
        }
    }
    
    // Ctrl/Cmd + Enter for new line in message
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        const messageInput = document.getElementById('messageInput');
        if (document.activeElement === messageInput) {
            e.preventDefault();
            messageInput.value += '\n';
        }
    }
});

// ===================================
// MOBILE RESPONSIVE FUNCTIONS
// ===================================

/**
 * Toggle mobile sidebar
 */
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('open');
}

/**
 * Close mobile sidebar when selecting a room
 */
function closeMobileSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (window.innerWidth <= 768) {
        sidebar.classList.remove('open');
    }
}

// ===================================
// ADVANCED FEATURES
// ===================================

/**
 * Search messages in current room
 */
function searchMessages(query) {
    if (!currentRoom || !query.trim()) {
        renderMessages();
        return;
    }
    
    const filteredMessages = messages[currentRoom].filter(message => 
        message.content.toLowerCase().includes(query.toLowerCase()) ||
        message.username.toLowerCase().includes(query.toLowerCase())
    );
    
    const container = document.getElementById('messagesContainer');
    container.innerHTML = '';
    
    filteredMessages.forEach(message => {
        const messageElement = createMessageElement(message);
        container.appendChild(messageElement);
    });
    
    scrollToBottom();
}

/**
 * Get room statistics
 */
function getRoomStats(roomId) {
    const room = rooms.find(r => r.id === roomId);
    const roomMessages = messages[roomId] || [];
    
    return {
        name: room?.name || 'Unknown',
        userCount: room?.users.length || 0,
        messageCount: roomMessages.length,
        lastActivity: roomMessages.length > 0 ? 
            roomMessages[roomMessages.length - 1].timestamp : null
    };
}

/**
 * Export chat history
 */
function exportChatHistory(roomId) {
    const roomMessages = messages[roomId] || [];
    const room = rooms.find(r => r.id === roomId);
    
    let chatHistory = `Chat History - ${room?.name || 'Unknown Room'}\n`;
    chatHistory += `Generated: ${new Date().toLocaleString()}\n`;
    chatHistory += '=' * 50 + '\n\n';
    
    roomMessages.forEach(message => {
        const timestamp = formatTime(message.timestamp);
        if (message.type === 'system') {
            chatHistory += `[${timestamp}] ${message.content}\n`;
        } else {
            chatHistory += `[${timestamp}] ${message.username}: ${message.content}\n`;
        }
    });
    
    // Create and download file
    const blob = new Blob([chatHistory], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat-${roomId}-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}

/**
 * Clear chat history for current room
 */
function clearChatHistory() {
    if (!currentRoom) return;
    
    if (confirm('Are you sure you want to clear all messages in this room?')) {
        messages[currentRoom] = [];
        renderMessages();
        addSystemMessage(currentRoom, 'Chat history cleared');
    }
}

/**
 * Send typing notification (in real app, this would be sent to server)
 */
function sendTypingNotification(isTyping) {
    if (!currentUser || !currentRoom) return;
    
    // In a real application, this would send a WebSocket message
    console.log(`${currentUser} is ${isTyping ? 'typing' : 'not typing'} in ${currentRoom}`);
}

/**
 * Handle message reactions (for future enhancement)
 */
function reactToMessage(messageId, reaction) {
    // Find message and add reaction
    if (!currentRoom) return;
    
    const message = messages[currentRoom].find(m => m.id === messageId);
    if (message) {
        if (!message.reactions) {
            message.reactions = {};
        }
        if (!message.reactions[reaction]) {
            message.reactions[reaction] = [];
        }
        
        const userIndex = message.reactions[reaction].indexOf(currentUser);
        if (userIndex === -1) {
            message.reactions[reaction].push(currentUser);
        } else {
            message.reactions[reaction].splice(userIndex, 1);
        }
        
        renderMessages();
    }
}

/**
 * Validate message content
 */
function validateMessage(content) {
    if (!content.trim()) {
        return { valid: false, error: 'Message cannot be empty' };
    }
    
    if (content.length > 500) {
        return { valid: false, error: 'Message too long (max 500 characters)' };
    }
    
    // Check for spam (same message sent multiple times quickly)
    const recentMessages = messages[currentRoom]
        ?.filter(m => m.username === currentUser && 
                    Date.now() - m.timestamp.getTime() < 5000) || [];
    
    if (recentMessages.length > 0 && 
        recentMessages[recentMessages.length - 1].content === content) {
        return { valid: false, error: 'Please avoid sending duplicate messages' };
    }
    
    return { valid: true };
}

/**
 * Enhanced send message with validation
 */
function sendMessageWithValidation() {
    const input = document.getElementById('messageInput');
    const content = input.value.trim();
    
    // Validate message
    const validation = validateMessage(content);
    if (!validation.valid) {
        alert(validation.error);
        return;
    }
    
    sendMessage();
}

// ===================================
// PERFORMANCE OPTIMIZATION
// ===================================

/**
 * Debounce function for performance optimization
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Throttle function for scroll events
 */
function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// Apply performance optimizations
const debouncedSearch = debounce(searchMessages, 300);
const throttledScroll = throttle(scrollToBottom, 100);

// ===================================
// ERROR HANDLING
// ===================================

/**
 * Global error handler
 */
window.addEventListener('error', function(e) {
    console.error('Application error:', e.error);
    // In a real app, you might want to show a user-friendly error message
});

/**
 * Handle unhandled promise rejections
 */
window.addEventListener('unhandledrejection', function(e) {
    console.error('Unhandled promise rejection:', e.reason);
    e.preventDefault();
});

// ===================================
// INITIALIZATION COMPLETE
// ===================================

console.log('Chat application script loaded successfully');

// Export functions for potential use in other scripts (if using modules)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        login,
        logout,
        sendMessage,
        selectRoom,
        searchMessages,
        exportChatHistory,
        clearChatHistory
    };
}