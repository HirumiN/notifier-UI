import { firebaseConfig } from "./config.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import {
  getDatabase,
  ref,
  push,
  onValue,
  remove,
  update
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";

// --- Inisialisasi Firebase ---
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const deadlinesRef = ref(db, "deadlines");

// --- Variabel Global ---
let deadlines = {};
let editingId = null;
let currentAlarms = []; // Array of { id, datetime }

// --- Elemen DOM ---
const titleInput = document.getElementById("title");
const dateInput = document.getElementById("date");
const saveBtn = document.getElementById("save-btn");
const cancelBtn = document.getElementById("cancel-btn");
const listDiv = document.getElementById("list");
const formTitle = document.getElementById("form-title");
const sortSelect = document.getElementById("sort-select");
const filterSelect = document.getElementById("filter-select");
const alarmInput = document.getElementById("alarm-datetime");
const addAlarmBtn = document.getElementById("add-alarm-btn");
const alarmList = document.getElementById("alarm-list");

// --- Fungsi bantu format tanggal ---
function formatDateTime(dtString) {
  const date = new Date(dtString);
  if (isNaN(date)) return "Format tidak valid";
  return date.toLocaleString("id-ID", {
    dateStyle: "short",
    timeStyle: "short",
    hour12: false,
  });
}

function renderAlarmList() {
  const section = document.querySelector(".alarm-section");
  const title = section.querySelector(".alarm-title");

  alarmList.innerHTML = '';

  if (currentAlarms.length === 0) {
    title.style.display = "none";
    alarmList.innerHTML = '<li class="small text-gray">Belum ada alarm</li>';
    return;
  }

  title.style.display = "flex";

  currentAlarms.forEach((a, i) => {
    const li = document.createElement("li");
    li.className = "alarm-item";
    li.innerHTML = `
      <div class="alarm-info">
        <i class="fa-regular fa-clock alarm-icon"></i>
        <span class="alarm-time">${formatDateTime(a.datetime)}</span>
      </div>
      <div class="alarm-actions">
        <button class="btn-icon edit" onclick="editAlarm(${i})" title="Edit Alarm">
          <i class="fa-solid fa-pen"></i>
        </button>
        <button class="btn-icon delete" onclick="deleteAlarm(${i})" title="Hapus Alarm">
          <i class="fa-solid fa-trash"></i>
        </button>
      </div>
    `;
    alarmList.appendChild(li);
  });
}

// --- Tambah alarm baru ---
addAlarmBtn.addEventListener("click", () => {
  const datetime = alarmInput.value;
  if (!datetime) return alert("Masukkan waktu alarm!");
  currentAlarms.push({
    id: Date.now() + "-" + datetime.replace(/[:T]/g, ""),
    datetime,
  });
  renderAlarmList();
  alarmInput.value = "";
});

// --- Edit alarm ---
window.editAlarm = (index) => {
  const newTime = prompt(
    "Ubah waktu alarm (format: yyyy-mm-ddTHH:MM)",
    currentAlarms[index].datetime
  );
  if (newTime) {
    currentAlarms[index].datetime = newTime;
    renderAlarmList();
  }
};

// --- Hapus alarm ---
window.deleteAlarm = (index) => {
  if (confirm("Hapus alarm ini?")) {
    currentAlarms.splice(index, 1);
    renderAlarmList();
  }
};

// --- Simpan deadline (baru / edit) ---
function saveDeadline() {
  const title = titleInput.value.trim();
  const date = dateInput.value;

  if (!title || !date) return alert("Judul dan tanggal wajib diisi!");

  const alarmsObj = {};
  currentAlarms.forEach((a) => (alarmsObj[a.id] = { datetime: a.datetime }));

  const data = { title, date, done: false, alarms: alarmsObj };

  if (editingId) {
    update(ref(db, `deadlines/${editingId}`), {
      ...data,
      done: deadlines[editingId].done,
    });
    editingId = null;
    formTitle.textContent = "Tambah Deadline";
  } else {
    push(deadlinesRef, data);
  }

  titleInput.value = "";
  dateInput.value = "";
  currentAlarms = [];
  renderAlarmList();
}

// --- Edit deadline ---
function editDeadline(key) {
  const d = deadlines[key];
  if (!d) return;

  editingId = key;
  formTitle.textContent = "Edit Deadline";
  titleInput.value = d.title;
  dateInput.value = d.date;

  currentAlarms = d.alarms
    ? Object.entries(d.alarms).map(([id, a]) => ({ id, datetime: a.datetime }))
    : [];

  renderAlarmList();
}

// --- Batal edit ---
function cancelEdit() {
  editingId = null;
  formTitle.textContent = "Tambah Deadline";
  titleInput.value = "";
  dateInput.value = "";
  currentAlarms = [];
  renderAlarmList();
}

// --- Hapus deadline ---
function deleteDeadline(key) {
  if (confirm("Yakin hapus deadline ini?")) remove(ref(db, `deadlines/${key}`));
}

// --- Toggle status selesai ---
function toggleStatus(key) {
  const d = deadlines[key];
  if (d) {
    update(ref(db, `deadlines/${key}`), {
      title: d.title,
      date: d.date,
      done: !d.done,
      alarms: d.alarms || {},
    });
  }
}

// --- Render daftar deadline ---
function renderList() {
  listDiv.innerHTML = "";
  const keys = Object.keys(deadlines);
  if (keys.length === 0) {
    listDiv.innerHTML = '<p class="small">Belum ada deadline.</p>';
    return;
  }

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const sortValue = sortSelect.value;
  const filterValue = filterSelect.value;

  let filteredKeys = keys.filter((key) => {
    const d = deadlines[key];
    const date = new Date(d.date);
    const expired = !d.done && date < today;
    const status = d.done ? "done" : expired ? "expired" : "pending";
    return filterValue === "all" || status === filterValue;
  });

  if (sortValue === "date-asc")
    filteredKeys.sort(
      (a, b) => new Date(deadlines[a].date) - new Date(deadlines[b].date)
    );
  if (sortValue === "date-desc")
    filteredKeys.sort(
      (a, b) => new Date(deadlines[b].date) - new Date(deadlines[a].date)
    );

  filteredKeys.forEach((key) => {
    const d = deadlines[key];
    const date = new Date(d.date);
    const expired = !d.done && date < today;
    const status = d.done ? "done" : expired ? "expired" : "pending";
    const statusText = d.done ? "Selesai" : expired ? "Expired" : "Pending";
    const alarms = d.alarms
      ? Object.values(d.alarms)
          .map((a) => formatDateTime(a.datetime))
          .join("<br>")
      : "-";

    const item = document.createElement("div");
    item.className = "card-item";
    item.innerHTML = `
      <div class="left">
        <input type="checkbox" ${d.done ? "checked" : ""} onchange="toggleStatus('${key}')">
        <div>
          <div class="title">${d.title}</div>
          <div class="meta">${date.toLocaleString("id-ID", { dateStyle: "full" })}</div>
          <div class="meta small">Alarm:<br>${alarms}</div>
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

// --- Sinkronisasi Realtime Firebase ---
onValue(deadlinesRef, (snapshot) => {
  deadlines = snapshot.val() || {};
  renderList();
});

// --- Event Listeners ---
saveBtn.addEventListener("click", saveDeadline);
cancelBtn.addEventListener("click", cancelEdit);
sortSelect.addEventListener("change", renderList);
filterSelect.addEventListener("change", renderList);

// --- Global ---
window.editDeadline = editDeadline;
window.deleteDeadline = deleteDeadline;
window.toggleStatus = toggleStatus;
