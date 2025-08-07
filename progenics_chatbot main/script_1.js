let chats = [];
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
const typingIndicator = $("#typingIndicator");
const logoutConfirmationDialog = $("#logoutConfirmationDialog");
const logoutDialogCancel = $("#logoutDialogCancel");
const logoutDialogConfirm = $("#logoutDialogConfirm");
const confirmationDialog = $("#confirmationDialog");
const dialogMessage = $("#dialogMessage");
const dialogCancel = $("#dialogCancel");
const dialogConfirm = $("#dialogConfirm");

// Typing Indicator Functions
function showTypingIndicator() {
    typingIndicator.style.display = 'flex';
    setTimeout(() => {
        typingIndicator.classList.add('visible');
    }, 10);
    scrollToBottom();
}

function hideTypingIndicator() {
    typingIndicator.classList.remove('visible');
    setTimeout(() => {
        typingIndicator.style.display = 'none';
    }, 300);
}

// Initialize chats from localStorage with error handling
function loadChats() {
  try {
    const savedChats = localStorage.getItem("clinicalChats");
    chats = savedChats ? JSON.parse(savedChats) : [];
    if (!Array.isArray(chats)) {
      throw new Error("Invalid chat data format");
    }
  } catch (error) {
    console.error("Error loading chats:", error);
    chats = [];
    showNotification("Error loading consultations. Starting fresh.", "error");
  }
}

// Scroll to bottom of messages container
function scrollToBottom() {
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

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

// Search functionality
function filterChats(searchTerm) {
    searchTerm = searchTerm.toLowerCase();
    const chatItems = document.querySelectorAll('.chat-item');
    
    if (!searchTerm) {
        // If search is empty, show all chats
        chatItems.forEach(item => item.style.display = 'flex');
        const noResults = document.getElementById('noSearchResults');
        if (noResults) noResults.remove();
        return;
    }
    
    let hasMatches = false;
    
    chatItems.forEach(item => {
        const title = item.querySelector('.chat-item-title').textContent.toLowerCase();
        const preview = item.querySelector('.chat-item-preview')?.textContent.toLowerCase() || '';
        const time = item.querySelector('.chat-item-time').textContent.toLowerCase();
        const count = item.querySelector('.chat-item-count')?.textContent.toLowerCase() || '';
        
        if (title.includes(searchTerm) || preview.includes(searchTerm) || time.includes(searchTerm) || count.includes(searchTerm)) {
            item.style.display = 'flex';
            hasMatches = true;
        } else {
            item.style.display = 'none';
        }
    });
    
    // Show "no results" message if no matches found
    const noResults = document.getElementById('noSearchResults');
    if (!hasMatches) {
        if (!noResults) {
            const noResultsDiv = document.createElement('div');
            noResultsDiv.id = 'noSearchResults';
            noResultsDiv.className = 'no-results';
            noResultsDiv.innerHTML = `
                <i class="fas fa-search"></i>
                <p>No consultations match your search</p>
            `;
            chatList.appendChild(noResultsDiv);
        }
    } else if (noResults) {
        noResults.remove();
    }
}

function init() {
  loadChats();
  renderChatList();
  
  // Don't automatically open the first chat
  showWelcomeMessage();
  
  setupEventListeners();
  updateButtonStates();
}

// Render the chat list in sidebar
function renderChatList() {
  // Clear existing listeners by cloning nodes
  const oldChatItems = chatList.querySelectorAll('.chat-item');
  oldChatItems.forEach(item => {
    item.replaceWith(item.cloneNode(true));
  });

  chatList.innerHTML = '';
  
  // Remove any existing "no results" message
  const noResults = document.getElementById('noSearchResults');
  if (noResults) noResults.remove();
  
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
    chatItem.innerHTML = `
      
      <div class="chat-item-content">
        <div class="chat-item-title">${sanitizeHTML(chat.title)}</div>
        <div class="chat-item-preview">${chat.messages[0]?.content.substring(0, 60) || 'No messages yet'}...</div>
      </div>
      <div class="chat-item-info">
        <div class="chat-item-time">${formatDate(chat.updatedAt)}</div>
        <div class="chat-item-count">${chat.messages.length} message${chat.messages.length !== 1 ? 's' : ''}</div>
      </div>
      <div class="chat-item-actions">
        <button class="delete-chat-btn" title="Delete consultation">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    `;
    
    chatItem.addEventListener('click', () => openChat(index));
    
    const deleteBtn = chatItem.querySelector('.delete-chat-btn');
    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      showDeleteConfirmation(index);
    });
    
    chatList.appendChild(chatItem);
  });
}

// Sanitize HTML to prevent XSS
function sanitizeHTML(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// Create a new chat
function newChat(autoOpen = true) {
  // Clear search input
  document.getElementById('searchInput').value = '';
  filterChats('');
  
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
  
  updateButtonStates();
}

// Open a specific chat
function openChat(index) {
  if (index < 0 || index >= chats.length) return;
  
  currentChat = index;
  const chat = chats[index];
  
  // Update UI
  chatTitle.textContent = sanitizeHTML(chat.title);
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
  
  scrollToBottom();
  updateButtonStates();
}

function sendMessage() {
  const text = messageInput.value.trim();
  if (!text) return;
  
  // If no current chat exists, create a new one
  if (currentChat === null || chats.length === 0) {
    newChat(true); // This will create and open a new chat
  }
  
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
  updateButtonStates();
  
  // Show typing indicator
  showTypingIndicator();
  
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
    updateButtonStates();
    
    // Hide typing indicator
    hideTypingIndicator();
  }, 1500);
}

// Add message to the UI
function addMessageToUI(message, shouldScroll = true) {
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
  
  // Add click handlers for message actions
  const copyBtn = messageFooter.querySelector('.message-action:nth-child(1)');
  copyBtn.addEventListener('click', () => {
    copyToClipboard(message.content);
    showNotification('Message copied to clipboard');
  });
  
  const addToNotesBtn = messageFooter.querySelector('.message-action:nth-child(2)');
  addToNotesBtn.addEventListener('click', () => {
    addToClinicalNotes(message.content);
  });
  
  messageContent.appendChild(messageHeader);
  messageContent.appendChild(messageText);
  messageContent.appendChild(messageFooter);
  messageDiv.appendChild(messageContent);
  messagesContainer.appendChild(messageDiv);
  
  if (shouldScroll) {
    scrollToBottom();
  }
}

// Generate a bot response (simplified for demo)
function generateBotResponse(userInput) {
  const responses = [
    `Based on the clinical information provided, I recommend considering genetic testing for...`,
    `The variant you described (${sanitizeHTML(userInput)}) is classified as VUS (Variant of Uncertain Significance) in ClinVar.`,
    `For this clinical scenario, the ACMG guidelines suggest...`,
    `This appears to be a case of potential hereditary cancer syndrome. The NCCN guidelines recommend...`,
    `The patient's presentation is concerning for a possible inborn error of metabolism.`
  ];
  
  return responses[Math.floor(Math.random() * responses.length)];
}

// Save chats to localStorage
function saveChats() {
  try {
    localStorage.setItem("clinicalChats", JSON.stringify(chats));
  } catch (error) {
    console.error("Error saving chats:", error);
    showNotification("Error saving consultations", "error");
  }
}

// Show welcome message when no chat is selected
function showWelcomeMessage() {
  welcomeMessage.style.display = 'block';
  chatTitle.textContent = 'Welcome';
  chatSubtitle.textContent = 'Select or create a consultation';
  messagesContainer.innerHTML = '';
  messagesContainer.appendChild(welcomeMessage);
  updateButtonStates();
}

// Format date for display
function formatDate(isoString) {
  try {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return 'Unknown date';
  }
}

// Format time for display
function formatTime(isoString) {
  try {
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return 'Unknown time';
  }
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

// Helper function to copy text to clipboard
function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    showNotification('Copied to clipboard');
  }).catch(err => {
    console.error('Failed to copy:', err);
    // Fallback for older browsers
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    showNotification('Copied to clipboard');
  });
}

// Function to update button states
function updateButtonStates() {
  const hasMessages = currentChat !== null && chats[currentChat]?.messages?.length > 0;
  document.getElementById('exportChat').disabled = !hasMessages;
  document.getElementById('addToNotes').disabled = !hasMessages;
  document.getElementById('shareChat').disabled = !hasMessages;
}

// Export Chat Functionality
function exportChat() {
  if (currentChat === null || !chats[currentChat]?.messages) {
    showNotification('No chat messages to export', 'error');
    return;
  }

  const chat = chats[currentChat];
  let chatContent = `Clinical Genomics Consultation - ${chat.title}\n\n`;
  chatContent += `Date: ${formatDate(chat.updatedAt)}\n`;
  chatContent += `Clinician: ${document.getElementById('userName').textContent}\n\n`;
  
  chat.messages.forEach(message => {
    const role = message.role === 'user' ? 'Clinician' : 'Genomics Assistant';
    chatContent += `${role}: ${message.content}\n\n`;
  });

  // Create download link
  const blob = new Blob([chatContent], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `GenomicsConsultation_${new Date(chat.updatedAt).toISOString().slice(0,10)}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Share Chat Functionality
function shareChat() {
  if (currentChat === null || !chats[currentChat]?.messages) {
    showNotification('No chat messages to share', 'error');
    return;
  }

  const chat = chats[currentChat];
  let shareContent = `Clinical Genomics Consultation - ${chat.title}\n\n`;
  shareContent += `Date: ${formatDate(chat.updatedAt)}\n`;
  shareContent += `Clinician: ${document.getElementById('userName').textContent}\n\n`;
  
  chat.messages.forEach(message => {
    const role = message.role === 'user' ? 'Clinician' : 'Genomics Assistant';
    shareContent += `${role}: ${message.content}\n\n`;
  });

  // Check if Web Share API is available
  if (navigator.share) {
    navigator.share({
      title: `Genomics Consultation - ${chat.title}`,
      text: shareContent,
      url: window.location.href
    }).catch(err => {
      console.error('Error sharing:', err);
      copyToClipboard(shareContent);
    });
  } else {
    // Fallback to clipboard copy
    copyToClipboard(shareContent);
  }
}

// Add to Clinical Notes Functionality
function addToClinicalNotes(content = null) {
  if (currentChat === null || !chats[currentChat]?.messages) {
    showNotification('No chat messages to add to notes', 'error');
    return;
  }

  const chat = chats[currentChat];
  let notesContent = `=== Genomics Consultation Summary ===\n`;
  notesContent += `Date: ${formatDate(chat.updatedAt)}\n`;
  notesContent += `Consultation Title: ${chat.title}\n\n`;
  notesContent += `Key Points:\n`;
  
  if (content) {
    // If specific content was provided (from message action)
    notesContent += `- ${content.split('\n')[0]}\n`;
  } else {
    // Otherwise summarize all assistant messages
    chat.messages
      .filter(message => message.role === 'assistant')
      .forEach((message, index) => {
        notesContent += `${index + 1}. ${message.content.split('\n')[0]}\n`;
      });
  }

  // Show confirmation dialog
  const confirmation = confirm(`Add this consultation summary to clinical notes?\n\n${notesContent.substring(0, 200)}...`);
  if (confirmation) {
    // Simulate API call with timeout
    setTimeout(() => {
      showNotification('Consultation summary successfully added to clinical notes');
    }, 1000);
  }
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
  
  // Search input
  const searchInput = document.getElementById('searchInput');
  searchInput.addEventListener('input', (e) => {
    filterChats(e.target.value);
  });
  
  // Clear search when clicking new chat button
  newChatBtn.addEventListener('click', () => {
    searchInput.value = '';
    filterChats('');
  });
  
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
  
  // Action buttons
  document.getElementById('exportChat').addEventListener('click', exportChat);
  document.getElementById('shareChat').addEventListener('click', shareChat);
  document.getElementById('addToNotes').addEventListener('click', addToClinicalNotes);
  
  // Logout functionality
  document.getElementById('logout-btn').addEventListener('click', () => {
    logoutConfirmationDialog.classList.add('active');
  });
  
  logoutDialogCancel.addEventListener('click', () => {
    logoutConfirmationDialog.classList.remove('active');
  });
  
  logoutDialogConfirm.addEventListener('click', () => {
    try {
      localStorage.removeItem('clinicalChats');
      showNotification('Logging out...', 'info');
      setTimeout(() => {
        window.location.href = 'index.html';
      }, 1000);
    } catch (error) {
      console.error("Error during logout:", error);
      showNotification('Error during logout', 'error');
    }
  });
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', init);