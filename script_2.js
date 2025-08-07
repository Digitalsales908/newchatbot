let chats = []; // Loaded from backend
let currentChat = null;
let sessionId = null;

const $ = (selector) => document.querySelector(selector);

// DOM elements
const chatList = $("#chatList");
const messagesContainer = $("#messagesContainer");
const messageInput = $("#messageInput");
const sendBtn = $("#sendBtn");
const chatTitle = $("#chatTitle");
const chatSubtitle = $("#chatSubtitle");
const welcomeMessage = $("#welcomeMessage");

// Helper to format
function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });
}
function formatTime(iso) {
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit'
  });
}

// Load chats from backend on DOMContentLoaded
document.addEventListener('DOMContentLoaded', async () => {
  try {
    const res = await fetch("/api/chat/history/");
    const data = await res.json();
    chats = data;
    renderChatList();
    if (chats.length > 0) {
      openChat(0);
    } else {
      showWelcomeMessage();
    }
  } catch (error) {
    console.error("Failed to load chat history:", error);
  }
  
  await checkOllamaStatus(); // ✅ Add this line
  setInterval(checkOllamaStatus, 30000); // ✅ Optional: Refresh every 30s
  setupEventListeners();
});

// Render sidebar chat list
function renderChatList() {
  chatList.innerHTML = '';

  if (chats.length === 0) {
    chatList.innerHTML = `<div class="empty-chats">
        <i class="fas fa-comment-medical"></i>
        <p>No consultations yet</p>
      </div>`;
    return;
  }

  chats.forEach((chat, index) => {
    const chatItem = document.createElement('div');
    chatItem.className = `chat-item ${currentChat === index ? 'active' : ''}`;
    chatItem.innerHTML = `
      <div class="chat-item-content">
        <div class="chat-item-title">${chat.title || `Session ${chat.session_id}`}</div>
        <div class="chat-item-time">${formatDate(chat.created_at)}</div>
        <div class="chat-item-count">${chat.messages.length} messages</div>
      </div>
      <div class="chat-item-actions">
        <button class="delete-chat-btn" title="Delete consultation">
          <i class="fas fa-trash"></i>
        </button>
      </div>`;

    chatItem.addEventListener('click', () => openChat(index));
    chatItem.querySelector('.delete-chat-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      deleteChat(index);
    });

    chatList.appendChild(chatItem);
  });
}

// Open a chat session
function openChat(index) {
  if (index < 0 || index >= chats.length) return;

  currentChat = index;
  const chat = chats[index];
  sessionId = chat.session_id;

  chatTitle.textContent = chat.title || `Session ${chat.session_id}`;
  chatSubtitle.textContent = `Created: ${formatDate(chat.created_at)}`;
  welcomeMessage.style.display = 'none';
  messagesContainer.innerHTML = '';

  chat.messages.forEach(msg => addMessageToUI(msg));
}
// Add this helper function at the TOP of the file (with other utility functions)
function sanitize(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}


// Add message to UI
function addMessageToUI(message, scrollToBottom = true) {
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${message.role}`;
  messageDiv.innerHTML = `
    <div class="message-content">
      <div class="message-header">
        ${message.role === 'assistant'
          ? `<span class="role-badge">Clinical Genomics Assistant</span><i class="fas fa-shield-alt"></i>`
          : `<span>${message.role === 'user' ? 'You' : 'Patient'}</span>`}
      </div>
      <div class="message-text">${sanitize(message.conten)}</div>
      <div class="message-footer">
        <span>${formatTime(message.timestamp)}</span>
        <div class="message-actions">
          <button class="message-action" title="Copy"><i class="fas fa-copy"></i></button>
          <button class="message-action" title="Add to notes"><i class="fas fa-file-medical"></i></button>
        </div>
      </div>
    </div>`;

  messagesContainer.appendChild(messageDiv);
  if (scrollToBottom) scrollToBottomOfMessages();
}

// Scroll messages to bottom
function scrollToBottomOfMessages() {
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Show welcome message
function showWelcomeMessage() {
  welcomeMessage.style.display = 'block';
  messagesContainer.innerHTML = '';
  messagesContainer.appendChild(welcomeMessage);
  chatTitle.textContent = 'Welcome';
  chatSubtitle.textContent = 'Select or create a consultation';
}

// Send user message and get assistant response
async function sendMessage() {
  const text = messageInput.value.trim();
  if (!text || currentChat === null) return;

  const userMessage = {
    role: 'user',
    content: text,
    timestamp: new Date().toISOString()
  };

  chats[currentChat].messages.push(userMessage);
  addMessageToUI(userMessage);

  messageInput.value = '';
  sendBtn.disabled = true;

  try {
  const res = await fetch("/api/chat/", { ... });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  
  if (!data.answer) throw new Error("Invalid response format");

  // ... rest of your existing code ...
} catch (err) {
  console.error("Send failed:", err);
  addMessageToUI({
    role: 'assistant',
    content: "⚠️ Failed to get a response. Please try again.",
    timestamp: new Date().toISOString()
  });
} finally {
  sendBtn.disabled = false;
}

    const data = await res.json();
    sessionId = data.session_id;
    chats[currentChat].session_id = data.session_id;

    const botMessage = {
      role: 'assistant',
      content: data.answer,
      timestamp: new Date().toISOString()
    };

    chats[currentChat].messages.push(botMessage);
    addMessageToUI(botMessage);
    renderChatList();
  } catch (err) {
    console.error("Send failed:", err);
  }

  sendBtn.disabled = false;


// Create new chat session
function newChat() {
  const chat = {
    session_id: null,
    title: `New Consultation ${chats.length + 1}`,
    created_at: new Date().toISOString(),
    messages: []
  };
  chats.unshift(chat);
  currentChat = 0;
  sessionId = null;
  renderChatList();
  openChat(0);
}

// Delete chat (local-only, you can extend this to call backend)
async function deleteChat(index) {
  const chat = chats[index];
  const sessionIdToDelete = chat.session_id;

  if (chat.messages.length === 0) {
  // Local-only deletion for empty unsaved chats
  chats.splice(index, 1);
  if (currentChat === index) {
    currentChat = null;
    sessionId = null;
    showWelcomeMessage();
  } else if (currentChat > index) {
    currentChat--;
  }
  renderChatList();
  return;
  }

  if (!sessionIdToDelete || !confirm("Are you sure you want to delete this chat?")) {
  return;
  }

  try {
    const response = await fetch(`/api/delete-chat/${sessionIdToDelete}/`, {
      method: 'DELETE',
      headers: {
        'X-CSRFToken': getCookie('csrftoken')
      }
    });

    if (response.status === 204) {
      chats.splice(index, 1);
      if (currentChat === index) {
        currentChat = null;
        sessionId = null;
        showWelcomeMessage();
      } else if (currentChat > index) {
        currentChat--;
      }
      renderChatList();
    } else {
      const data = await response.json();
      console.error('Delete failed:', data);
      alert('Failed to delete chat.');
    }
  } catch (err) {
    console.error('Error deleting chat:', err);
    alert('An error occurred while deleting the chat.');
  }
}

// Setup event listeners
function setupEventListeners() {
  messageInput.addEventListener('input', () => {
    sendBtn.disabled = messageInput.value.trim() === '';
  });
   // Add this to replace chat item listeners:
  chatList.addEventListener('click', (e) => {
    const chatItem = e.target.closest('.chat-item');
    if (chatItem) {
      const index = Array.from(chatList.children).indexOf(chatItem);
      openChat(index);
    }

    const deleteBtn = e.target.closest('.delete-chat-btn');
    if (deleteBtn) {
      e.stopPropagation();
      const chatItem = deleteBtn.closest('.chat-item');
      const index = Array.from(chatList.children).indexOf(chatItem);
      deleteChat(index);
    }
  });
}

  messageInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  sendBtn.addEventListener('click', sendMessage);

  document.getElementById("newChatBtn").addEventListener("click", newChat);


// CSRF helper
function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  return parts.length === 2 ? parts.pop().split(';').shift() : '';
}

document.getElementById("logout-btn").addEventListener("click", async () => {
  if (!confirm("Are you sure you want to logout?")) return;

  try {
    const response = await fetch("/api/logout/", {
      method: "POST",
      headers: {
        "X-CSRFToken": getCookie("csrftoken"),
        "Content-Type": "application/json"
      }
    });

    if (response.ok) {
      // Redirect to login or home page after logout
      window.location.href = "/";
    } else {
      const data = await response.json();
      console.error("Logout failed:", data);
      alert("Logout failed. Please try again.");
    }
  } catch (err) {
    console.error("Logout error:", err);
    alert("An error occurred while logging out.");
  }
});



async function checkOllamaStatus() {
  try {
    const res = await fetch("/api/ollama/status/");
    const data = await res.json();

    const statusDot = document.getElementById("ollamaStatus");
    const statusText = document.getElementById("ollamaStatusText");

    if (data.status === "online") {
      statusDot.classList.remove("offline");
      statusDot.classList.add("online");
      statusText.textContent = "Ollama Connected";
    } else {
      statusDot.classList.remove("online");
      statusDot.classList.add("offline");
      statusText.textContent = "Ollama Disconnected";
    }
  } catch (err) {
    console.error("Failed to check Ollama status:", err);
    const statusDot = document.getElementById("ollamaStatus");
    const statusText = document.getElementById("ollamaStatusText");
    statusDot.classList.remove("online");
    statusDot.classList.add("offline");
    statusText.textContent = "Ollama Disconnected";
  }
}
