# Deadline Manager

Aplikasi web sederhana untuk mengelola deadline tugas atau event dengan integrasi Firebase Realtime Database.

## Fitur

- **Tambah Deadline**: Input judul dan tanggal deadline.
- **Edit Deadline**: Ubah judul atau tanggal deadline yang sudah ada.
- **Hapus Deadline**: Hapus deadline yang tidak diperlukan.
- **Tandai Selesai**: Centang checkbox untuk menandai deadline selesai.
- **Status Otomatis**: Status "Expired" untuk deadline yang melewati batas waktu tapi belum selesai.
- **Alarm**: Set alarm untuk deadline dengan waktu spesifik, dapat ditambah, diedit, atau dihapus.
- **Realtime Sync**: Data tersimpan dan disinkronkan secara real-time dengan Firebase.

## Teknologi

- **Frontend**: HTML, CSS, JavaScript (ES6 Modules)
- **Backend**: Firebase Realtime Database
- **Styling**: CSS Variables untuk tema yang konsisten

## Setup

1. **Clone Repository**:
   ```bash
   git clone <repository-url>
   cd notifier-UI
   ```

2. **Konfigurasi Firebase**:
   - Buat proyek di [Firebase Console](https://console.firebase.google.com/).
   - Aktifkan Realtime Database.
   - Salin konfigurasi API ke `config.js`:
     ```javascript
     export const firebaseConfig = {
       apiKey: "your-api-key",
       authDomain: "your-project.firebaseapp.com",
       databaseURL: "https://your-project-default-rtdb.firebaseio.com",
       projectId: "your-project",
       storageBucket: "your-project.appspot.com",
       messagingSenderId: "1234567890",
       appId: "1:1234567890:web:abcdef123456"
     };
     ```

3. **Jalankan Aplikasi**:
   - Buka `index.html` di browser, atau
   - Gunakan server lokal seperti Python:
     ```bash
     python -m http.server 8000
     ```
     Kemudian buka `http://localhost:8000/index.html`.

## Struktur Data Firebase

Data disimpan di path `/deadlines` dengan struktur objek:

```json
{
  "dl1": {
    "title": "Tugas Akhir",
    "date": "2025-12-15",
    "done": false,
    "alarms": {
      "alarm1": {
        "datetime": "2025-12-14T10:00"
      }
    }
  },
  "dl2": {
    "title": "Presentasi",
    "date": "2025-12-20",
    "done": true,
    "alarms": {}
  }
}
```

## Status Deadline

- **Pending**: Deadline belum selesai dan belum expired.
- **Done**: Deadline sudah ditandai selesai.
- **Expired**: Deadline belum selesai tapi sudah melewati tanggal batas.

