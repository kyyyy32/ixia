# Asisten AI Sekolah

Website sekolah + chatbot AI (Express.js + Google GenAI). Dibuat mengikuti modul *Backend AI Development*.

## Cara menjalankan di VS Code
1. Buka folder ini di VS Code (File > Open Folder).
2. Buka terminal (Ctrl + `) lalu jalankan: `npm install`
3. Buka file `.env`, ganti `GEMINI_API_KEY` dengan API key Gemini kamu.
4. Jalankan: `node server.js`
5. Buka http://localhost:3000 di browser, klik tombol chat di pojok kanan bawah.

## Uji API tanpa web
Install ekstensi **REST Client**, buka `uji_api.http`, klik *Send Request*.
Letakkan berkas contoh (kopi.jpg, materi ke 2.pdf, audio.mp3, video.mp4) sejajar dengan file tersebut.

## Struktur
- `server.js` : backend Express, 6 endpoint AI + menyajikan folder `public`
- `public/` : halaman web (`index.html`, `style.css`, `chat.js`)
- `uji_api.http` : skenario pengujian REST Client

## Ubah identitas sekolah
Cari "SMK Budi Utomo" di `public/index.html` dan `server.js`, lalu ganti dengan nama sekolahmu.
