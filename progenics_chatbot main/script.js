let chats = JSON.parse(localStorage.getItem("progenicsChats") || "[]");
let current = null;
const $ = s => document.querySelector(s);
const sidebar = $("#sidebar");
const listEl = $("#chat-list");
const boxEl = $("#chat-box");
const inputEl = $("#user-input");

function renderList() {
  listEl.innerHTML = '';
  chats.forEach((c, i) => {
    const row = document.createElement('div');
    row.className = 'row';
    row.innerHTML = `
      <button onclick="openChat(${i})">${c.title}</button>
      <button class="delete" onclick="delChat(${i})">🗑</button>`;
    listEl.appendChild(row);
  });
}

function newChat(auto = true) {
  chats.unshift({ title: `Chat ${chats.length + 1}`, msgs: [] });
  save();
  renderList();
  if (auto) openChat(0);
}

function openChat(idx) {
  current = idx;
  boxEl.innerHTML = '';
  chats[idx].msgs.forEach(m => boxEl.insertAdjacentHTML('beforeend', m));
  scroll();
}

function send() {
  if (current === null) newChat(false), openChat(0);
  const txt = inputEl.value.trim();
  if (!txt) return;
  inputEl.value = '';
  addMsg(`<p><strong>You:</strong> ${txt}</p>`);
  setTimeout(() => {
    addMsg(`<p><strong>Bot:</strong> This is a reply to “${txt}”</p>`);
    addDivider(); // Add horizontal divider after bot reply
  }, 600);
}

function addMsg(html) {
  chats[current].msgs.push(html);

  // Set title only from first message, and clean "You:" prefix
  if (chats[current].msgs.length === 1) {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    const text = tempDiv.textContent || tempDiv.innerText || '';
    const cleanText = text.replace(/^You:\s*/i, ''); // Remove "You:" prefix
    chats[current].title = cleanText.slice(0, 30) + (cleanText.length > 30 ? '…' : '');
  }

  boxEl.insertAdjacentHTML('beforeend', html);
  save();
  renderList(); // Update titles
  scroll();
}

function delChat(i) {
  if (!confirm('Delete?')) return;
  chats.splice(i, 1);
  save();
  renderList();
  boxEl.innerHTML = '';
  current = null;
}

function save() {
  localStorage.setItem("progenicsChats", JSON.stringify(chats));
}

function scroll() {
  boxEl.scrollTop = boxEl.scrollHeight;
  inputEl.focus();
}

function toggle() {
  if (innerWidth > 700) {
    sidebar.classList.toggle('collapsed');
    document.getElementById('layout').classList.toggle('hide-sidebar');
  } else {
    sidebar.classList.toggle('open');
  }
}

function logout() {
  if (confirm('Clear chats & logout?')) {
    localStorage.clear();
    location.href = 'index.html';
  }
}

window.addEventListener('DOMContentLoaded', () => {
  if (!chats.length) newChat(false);
  renderList();
  openChat(0);
  scroll();

  $('#send-btn').onclick = send;
  $('#new-btn').onclick = () => newChat(true);
  $('#logout-btn').onclick = logout;
  $('#menu-btn').onclick = toggle;
  inputEl.addEventListener('keydown', e => e.key === 'Enter' && send());
});

// Single valid version of the divider function
function addDivider() {
  const divider = document.createElement("hr");
  divider.className = "chat-divider";
  boxEl.appendChild(divider);
}
