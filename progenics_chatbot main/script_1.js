let chats = JSON.parse(localStorage.getItem("clinicalChats") || "[]");
let currentChat = null;
const $ = (selector) => document.querySelector(selector);

// DOM Elements
const sidebar = $("#sidebar");
const chatList = $("#chatList");
const messagesContainer = $("#messagesContainer");
const messageInput = $("#messageInput");
const sendBtn = $("#sendBtn");
const newChatBtn = $("#newChatBtn");
const toggleSidebarBtn = $("#toggleSidebar");
const closeSidebarBtn = $("#closeSidebar");
const mobileOverlay = $("#mobileOverlay");
const chatTitle = $("#chatTitle");
const chatSubtitle = $("#chatSubtitle");
const welcomeMessage = $("#welcomeMessage");


// ============= NEW CODE START =============
// Confirmation Dialog Elements
const confirmationDialog = $("#confirmationDialog");
const dialogMessage = $("#dialogMessage");
const dialogCancel = $("#dialogCancel");
const dialogConfirm = $("#dialogConfirm");

// Show delete confirmation dialog
function showDeleteConfirmation(index) {
  const chat = chats[index];
  dialogMessage.textContent = `Are you sure you want to delete "${chat.title}"? This action cannot be undone.`;
  confirmationDialog.dataset.chatIndex = index;
  confirmationDialog.classList.add('active');
}

// Delete chat after confirmation
function deleteChatConfirmed() {
  const index = parseInt(confirmationDialog.dataset.chatIndex);
  if (isNaN(index)) return;
  
  chats.splice(index, 1);
  saveChats();
  renderChatList();
  
  if (currentChat === index) {
    currentChat = null;
    showWelcomeMessage();
  } else if (currentChat > index) {
    currentChat--;
  }
  
  showNotification('Consultation deleted successfully');
  confirmationDialog.classList.remove('active');
}

// Show notification
function showNotification(message, type = 'success') {
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.textContent = message;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.classList.add('show');
  }, 10);
  
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => {
      notification.remove();
    }, 300);
  }, 3000);
}
// ============= NEW CODE END =============

// Initialize the app
function init() {
  renderChatList();
  if (chats.length === 0) {
    newChat(false);
  } else {
    openChat(0);
  }
  setupEventListeners();
}

// Render the chat list in sidebar
function renderChatList() {
  chatList.innerHTML = '';
  
  if (chats.length === 0) {
    chatList.innerHTML = `
      <div class="empty-chats">
        <i class="fas fa-comment-medical"></i>
        <p>No consultations yet</p>
      </div>
    `;
    return;
  }

  chats.forEach((chat, index) => {
    const chatItem = document.createElement('div');
    chatItem.className = `chat-item ${currentChat === index ? 'active' : ''}`;
    chatItem.dataset.id = chat.id;
    // ============= MODIFIED CODE START =============
    chatItem.innerHTML = `
      <div class="chat-item-content">
        <div class="chat-item-title">${chat.title}</div>
        <div class="chat-item-time">${formatDate(chat.updatedAt)}</div>
        <div class="chat-item-count">${chat.messages.length} messages</div>
      </div>
      <div class="chat-item-actions">
        <button class="delete-chat-btn" title="Delete consultation">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    `;
    // ============= MODIFIED CODE END =============
    
    chatItem.addEventListener('click', () => openChat(index));
    
    // ============= NEW CODE START =============
    const deleteBtn = chatItem.querySelector('.delete-chat-btn');
    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      showDeleteConfirmation(index);
    });
    // ============= NEW CODE END =============
    
    chatList.appendChild(chatItem);
  });
}

// Create a new chat
function newChat(autoOpen = true) {
  const newChat = {
    id: Date.now(),
    title: `New Consultation ${chats.length + 1}`,
    patientId: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    messages: []
  };
  
  chats.unshift(newChat);
  saveChats();
  renderChatList();
  
  if (autoOpen) {
    openChat(0);
  } else {
    showWelcomeMessage();
  }
}

// Open a specific chat
function openChat(index) {
  if (index < 0 || index >= chats.length) return;
  
  currentChat = index;
  const chat = chats[index];
  
  // Update UI
  chatTitle.textContent = chat.title;
  chatSubtitle.textContent = `Last updated: ${formatDate(chat.updatedAt)}`;
  welcomeMessage.style.display = 'none';
  
  // Render messages
  messagesContainer.innerHTML = '';
  chat.messages.forEach(message => {
    addMessageToUI(message, false);
  });
  
  // Highlight active chat in list
  document.querySelectorAll('.chat-item').forEach((item, i) => {
    item.classList.toggle('active', i === index);
  });
  
  // Close sidebar on mobile
  if (window.innerWidth <= 768) {
    sidebar.classList.remove('open');
    mobileOverlay.classList.remove('show');
  }
}

// Send a new message
function sendMessage() {
  const text = messageInput.value.trim();
  if (!text || currentChat === null) return;
  
  // Create user message
  const userMessage = {
    id: Date.now(),
    role: 'user',
    content: text,
    timestamp: new Date().toISOString()
  };
  
  // Add to chat
  chats[currentChat].messages.push(userMessage);
  chats[currentChat].updatedAt = new Date().toISOString();
  
  // Update title if first message
  if (chats[currentChat].messages.length === 1) {
    chats[currentChat].title = text.slice(0, 50) + (text.length > 50 ? '...' : '');
  }
  
  // Clear input
  messageInput.value = '';
  sendBtn.disabled = true;
  
  // Add to UI
  addMessageToUI(userMessage);
  
  // Simulate bot response
  setTimeout(() => {
    const botMessage = {
      id: Date.now() + 1,
      role: 'assistant',
      content: generateBotResponse(text),
      timestamp: new Date().toISOString(),
      references: []
    };
    
    chats[currentChat].messages.push(botMessage);
    chats[currentChat].updatedAt = new Date().toISOString();
    addMessageToUI(botMessage);
    saveChats();
    renderChatList();
  }, 1000);
}

// Add message to the UI
function addMessageToUI(message, scrollToBottom = true) {
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${message.role}`;
  
  const messageContent = document.createElement('div');
  messageContent.className = 'message-content';
  
  const messageHeader = document.createElement('div');
  messageHeader.className = 'message-header';
  
  if (message.role === 'assistant') {
    messageHeader.innerHTML = `
      <span class="role-badge">Clinical Genomics Assistant</span>
      <i class="fas fa-shield-alt"></i>
    `;
  } else {
    messageHeader.innerHTML = `
      <span>${message.role === 'user' ? 'You' : 'Patient'}</span>
    `;
  }
  
  const messageText = document.createElement('div');
  messageText.className = 'message-text';
  messageText.textContent = message.content;
  
  const messageFooter = document.createElement('div');
  messageFooter.className = 'message-footer';
  messageFooter.innerHTML = `
    <span>${formatTime(message.timestamp)}</span>
    <div class="message-actions">
      <button class="message-action" title="Copy">
        <i class="fas fa-copy"></i>
      </button>
      <button class="message-action" title="Add to notes">
        <i class="fas fa-file-medical"></i>
      </button>
    </div>
  `;
  
  messageContent.appendChild(messageHeader);
  messageContent.appendChild(messageText);
  messageContent.appendChild(messageFooter);
  messageDiv.appendChild(messageContent);
  messagesContainer.appendChild(messageDiv);
  
  if (scrollToBottom) {
    scrollToBottom();
  }
}

// Generate a bot response (simplified for demo)
function generateBotResponse(userInput) {
  const responses = [
    `Based on the clinical information provided, I recommend considering genetic testing for...`,
    `The variant you described (${userInput}) is classified as VUS (Variant of Uncertain Significance) in ClinVar.`,
    `For this clinical scenario, the ACMG guidelines suggest...`,
    `This appears to be a case of potential hereditary cancer syndrome. The NCCN guidelines recommend...`,
    `The patient's presentation is concerning for a possible inborn error of metabolism.`
  ];
  
  return responses[Math.floor(Math.random() * responses.length)];
}

// ============= REMOVED OLD DELETE FUNCTION =============
// Old deleteChat function removed since we're using the new confirmation dialog version

// Save chats to localStorage
function saveChats() {
  localStorage.setItem("clinicalChats", JSON.stringify(chats));
}

// Show welcome message when no chat is selected
function showWelcomeMessage() {
  welcomeMessage.style.display = 'block';
  chatTitle.textContent = 'Welcome';
  chatSubtitle.textContent = 'Select or create a consultation';
  messagesContainer.innerHTML = '';
  messagesContainer.appendChild(welcomeMessage);
}

// Format date for display
function formatDate(isoString) {
  const date = new Date(isoString);
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Format time for display
function formatTime(isoString) {
  const date = new Date(isoString);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Scroll to bottom of messages
function scrollToBottom() {
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Toggle sidebar visibility
function toggleSidebar() {
  if (window.innerWidth > 768) {
    sidebar.classList.toggle('collapsed');
  } else {
    sidebar.classList.toggle('open');
    mobileOverlay.classList.toggle('show');
  }
}

// Close sidebar on mobile
function closeSidebar() {
  sidebar.classList.remove('open');
  mobileOverlay.classList.remove('show');
}

// Setup event listeners
function setupEventListeners() {
  // Message input
  messageInput.addEventListener('input', () => {
    sendBtn.disabled = messageInput.value.trim() === '';
  });
  
  messageInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });
  
  // Buttons
  sendBtn.addEventListener('click', sendMessage);
  newChatBtn.addEventListener('click', () => newChat(true));
  toggleSidebarBtn.addEventListener('click', toggleSidebar);
  closeSidebarBtn.addEventListener('click', closeSidebar);
  mobileOverlay.addEventListener('click', closeSidebar);
  
  // ============= NEW CODE START =============
  // Confirmation dialog events
  dialogCancel.addEventListener('click', () => {
    confirmationDialog.classList.remove('active');
  });
  
  dialogConfirm.addEventListener('click', deleteChatConfirmed);
  
  confirmationDialog.addEventListener('click', (e) => {
    if (e.target === confirmationDialog) {
      confirmationDialog.classList.remove('active');
    }
  });
  // ============= NEW CODE END =============
  
  // Quick action buttons
  document.querySelectorAll('.quick-action-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const action = btn.dataset.action;
      let prompt = '';
      
      switch(action) {
        case 'variant-interpretation':
          prompt = 'Interpret the following genetic variant: ';
          break;
        case 'risk-assessment':
          prompt = 'Provide a risk assessment for: ';
          break;
        case 'treatment-guidelines':
          prompt = 'What are the treatment guidelines for: ';
          break;
      }
      
      messageInput.value = prompt;
      messageInput.focus();
    });
  });
}
// ======================
// Logout Functionality
// ======================
document.getElementById('logout-btn').addEventListener('click', function() {
    // Clear all chat-related data
    localStorage.removeItem('clinicalChats');
    
    // If you have authentication tokens or user data:
    // localStorage.removeItem('authToken');
    // localStorage.removeItem('userData');
    
    // Optional: Show logout confirmation
    showNotification('Logging out...', 'info');
    
    // Redirect to login page - change the URL as needed
    setTimeout(() => {
        window.location.href = 'index.html'; // Change this to your actual login page
    }, 1000);
});

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', init);