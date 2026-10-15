# Latihan — Platform Belajar Koding Interaktif

Aplikasi web pelatihan pemrograman bergaya Progate: materi berbentuk slide, lalu latihan langsung di editor browser dengan pratinjau dan pengecekan jawaban otomatis.

## Fitur

- 3 kursus: **HTML Dasar**, **CSS Dasar**, **JavaScript Dasar** (10 pelajaran)
- Slide materi singkat sebelum setiap latihan
- Editor multi-file (`index.html`, `style.css`, `script.js`), pratinjau langsung, dan konsol
- Pengecekan otomatis per kriteria (✓/✗), petunjuk bertahap, lihat jawaban, reset kode
- Progres, XP, dan level tersimpan di `localStorage`; kode yang sedang ditulis juga tersimpan otomatis
- Pintasan: `Ctrl/Cmd + Enter` untuk cek jawaban, `Tab` untuk indentasi

## Menjalankan

Tanpa build step. Buka `index.html` langsung di browser, atau jalankan server statis:

```bash
python3 -m http.server 8000
# buka http://localhost:8000
```

## Struktur

```
index.html       kerangka halaman
css/style.css    tampilan (mendukung mode gelap & layar ponsel)
js/courses.js    data kursus, slide, latihan, dan kriteria pengecekan
js/runner.js     menjalankan kode peserta di iframe & menangkap console.log
js/store.js      progres/XP di localStorage
js/app.js        router (hash) dan semua tampilan
```

## Menambah pelajaran

Tambahkan objek ke `lessons` di `js/courses.js`:

```js
{
  title: 'Judul Pelajaran',
  slides: [{ title: 'Judul slide', body: '<p>Materi (HTML)</p>' }],
  exercise: {
    instruction: 'Apa yang harus dikerjakan',
    files: [{ name: 'index.html', content: 'kode awal' }],
    hints: ['petunjuk 1'],
    solution: { 'index.html': 'kode jawaban' },
    checks: [
      // test menerima { doc, win, logs, code }
      { desc: 'Ada <h1>', test: ({ doc }) => !!doc.querySelector('h1') },
    ],
  },
}
```

- `doc` / `win`: dokumen & window hasil render (untuk cek DOM dan `getComputedStyle`)
- `logs`: array string hasil `console.log`
- `code`: isi file per nama, untuk cek pola sintaks

## Keterbatasan

- Belum ada akun/backend: progres hanya ada di browser yang sama.
- Kode peserta dijalankan di iframe *same-origin* agar bisa diperiksa — aman untuk penggunaan pribadi/lokal, tetapi untuk platform multi-pengguna pengecekan sebaiknya dipindah ke iframe sandbox lintas-origin atau server.
