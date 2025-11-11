import { firebaseConfig } from "./config.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getDatabase, ref, push, onValue, remove, update } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const deadlinesRef = ref(db, 'deadlines');

// Data will be loaded from Firebase
let deadlines = {};

// DOM elements
const titleInput = document.getElementById('title');
const dateInput = document.getElementById('date');
const saveBtn = document.getElementById('save-btn');
const cancelBtn = document.getElementById('cancel-btn');
const listDiv = document.getElementById('list');
const formTitle = document.getElementById('form-title');

// Current editing ID
let editingId = null;

// Render the list of deadlines
function renderList() {
  listDiv.innerHTML = '';
  const deadlineKeys = Object.keys(deadlines);
  if (deadlineKeys.length === 0) {
    listDiv.innerHTML = '<p class="small">Belum ada deadline.</p>';
    return;
  }
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  deadlineKeys.forEach(key => {
    const deadline = deadlines[key];
    const deadlineDate = new Date(deadline.date);
    const isExpired = !deadline.done && deadlineDate < today;
    const status = deadline.done ? 'done' : (isExpired ? 'expired' : 'pending');
    const statusText = deadline.done ? 'Selesai' : (isExpired ? 'Expired' : 'Pending');
    const item = document.createElement('div');
    item.className = 'card-item';
    item.innerHTML = `
      <div class="left">
        <input type="checkbox" ${deadline.done ? 'checked' : ''} onchange="toggleStatus('${key}')">
        <div>
          <div class="title">${deadline.title}</div>
          <div class="meta">${new Date(deadline.date).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta', dateStyle: 'full' })}</div>
        </div>
      </div>
      <div>
        <span class="status-badge status-${status}">${statusText}</span>
        <button class="btn-group" onclick="editDeadline('${key}')">Edit</button>
        <button class="btn-group danger" onclick="deleteDeadline('${key}')">Hapus</button>
      </div>
    `;
    listDiv.appendChild(item);
  });
}

// Add or update deadline
function saveDeadline() {
  const title = titleInput.value.trim();
  const date = dateInput.value;
  if (!title || !date) {
    alert('Judul dan tanggal wajib diisi!');
    return;
  }
  if (editingId) {
    // Update existing
    update(ref(db, `deadlines/${editingId}`), {
      title: title,
      date: date,
      done: deadlines[editingId].done
    });
    editingId = null;
    formTitle.textContent = 'Tambah Deadline';
  } else {
    // Add new
    push(deadlinesRef, {
      title: title,
      date: date,
      done: false
    });
  }
  titleInput.value = '';
  dateInput.value = '';
}

// Cancel editing
function cancelEdit() {
  editingId = null;
  formTitle.textContent = 'Tambah Deadline';
  titleInput.value = '';
  dateInput.value = '';
}

// Edit deadline
function editDeadline(key) {
  const deadline = deadlines[key];
  if (deadline) {
    editingId = key;
    formTitle.textContent = 'Edit Deadline';
    titleInput.value = deadline.title;
    dateInput.value = deadline.date;
  }
}

// Delete deadline
function deleteDeadline(key) {
  if (confirm('Yakin hapus deadline ini?')) {
    remove(ref(db, `deadlines/${key}`));
  }
}

// Toggle status
function toggleStatus(key) {
  const deadline = deadlines[key];
  if (deadline) {
    update(ref(db, `deadlines/${key}`), {
      title: deadline.title,
      date: deadline.date,
      done: !deadline.done
    });
  }
}

// Listen for changes in Firebase
onValue(deadlinesRef, (snapshot) => {
  deadlines = snapshot.val() || {};
  renderList();
});

// Event listeners
saveBtn.addEventListener('click', saveDeadline);
cancelBtn.addEventListener('click', cancelEdit);

// Make functions global for onclick
window.editDeadline = editDeadline;
window.deleteDeadline = deleteDeadline;
window.toggleStatus = toggleStatus;
