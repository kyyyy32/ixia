const MODE = {
  tanya:  { label: 'Tanya', hint: 'Tulis pertanyaanmu…', url: '/tanya-ai', json: 'pertanyaan', out: 'jawaban' },
  gambar: { label: 'Gambar', hint: 'Perintah (boleh kosong)…', url: '/analisis-gambar', file: 'gambar', accept: 'image/*', out: 'analisis' },
  dokumen:{ label: 'Dokumen', hint: 'Perintah (boleh kosong)…', url: '/analisis-dokumen', file: 'dokumen', accept: '.pdf,.txt', out: 'analisis_dokumen' },
  audio:  { label: 'Audio', hint: 'Pilih berkas audio < 15 detik', url: '/transkrip-audio', file: 'audio', accept: 'audio/*', out: 'transkrip', noText: true },
  video:  { label: 'Video', hint: 'Perintah (boleh kosong)…', url: '/analisis-video', file: 'video', accept: 'video/*', out: 'analisis_video' },
  buat:   { label: 'Ide gambar', hint: 'Deskripsikan gambar yang diinginkan…', url: '/buat-gambar', json: 'deskripsi', out: 'detail_resep_ai' },
};

const $ = (id) => document.getElementById(id);
const panel = $('chatPanel'), fab = $('chatFab'), msgs = $('msgs'), form = $('chatForm');
const text = $('chatText'), fileInput = $('fileInput'), attachBtn = $('attachBtn'), chip = $('fileChip');
let mode = 'tanya', busy = false, started = false;

const fmt = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>');

function tambah(cls, html) {
  const d = document.createElement('div');
  d.className = 'm ' + cls;
  d.innerHTML = html;
  msgs.appendChild(d);
  msgs.scrollTop = msgs.scrollHeight;
  return d;
}

function setMode(k) {
  mode = k;
  const m = MODE[k];
  document.querySelectorAll('#modeBar button').forEach((b) => b.classList.toggle('on', b.dataset.k === k));
  text.placeholder = m.hint;
  text.disabled = !!m.noText;
  attachBtn.hidden = !m.file;
  fileInput.accept = m.accept || '';
  fileInput.value = '';
  chip.hidden = true;
}

function buka(mulai) {
  panel.hidden = false;
  fab.setAttribute('aria-expanded', 'true');
  if (!started) {
    started = true;
    tambah('bot', 'Halo! Aku Asisten AI sekolah. Pilih mode di atas, lalu tulis atau unggah sesuatu.');
  }
  if (mulai) mulai();
  if (!text.disabled) text.focus();
}
const tutup = () => { panel.hidden = true; fab.setAttribute('aria-expanded', 'false'); };

async function kirim() {
  if (busy) return;
  const m = MODE[mode], teks = text.value.trim(), berkas = fileInput.files[0];
  if (m.file && !berkas) return tambah('bot err', 'Pilih berkas dulu dengan tombol + di sebelah kiri.');
  if (!m.file && !teks) return;

  tambah('user', fmt(teks || (berkas ? 'Berkas: ' + berkas.name : '')));
  text.value = '';
  busy = true; form.querySelector('.send').disabled = true;
  const tunggu = tambah('bot wait', 'Sedang berpikir…');

  try {
    let opsi;
    if (m.file) {
      const fd = new FormData();
      if (teks) fd.append('instruksi', teks);
      fd.append(m.file, berkas);
      opsi = { method: 'POST', body: fd };
    } else {
      opsi = { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ [m.json]: teks }) };
    }
    const res = await fetch(m.url, opsi);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Terjadi kesalahan');
    tunggu.className = 'm bot';
    tunggu.innerHTML = fmt(data[m.out] || 'Tidak ada jawaban.');
  } catch (e) {
    tunggu.className = 'm bot err';
    tunggu.textContent = e.message.includes('fetch')
      ? 'Tidak bisa terhubung ke server. Pastikan "node server.js" sedang berjalan.'
      : e.message;
  }
  fileInput.value = ''; chip.hidden = true;
  busy = false; form.querySelector('.send').disabled = false;
  msgs.scrollTop = msgs.scrollHeight;
}

// Susun tombol mode
const bar = $('modeBar');
Object.entries(MODE).forEach(([k, m]) => {
  const b = document.createElement('button');
  b.type = 'button'; b.dataset.k = k; b.textContent = m.label;
  b.onclick = () => setMode(k);
  bar.appendChild(b);
});
setMode('tanya');

fab.onclick = () => (panel.hidden ? buka() : tutup());
$('chatClose').onclick = tutup;
attachBtn.onclick = () => fileInput.click();
fileInput.onchange = () => {
  const f = fileInput.files[0];
  chip.hidden = !f;
  if (f) chip.textContent = 'Berkas: ' + f.name;
};
form.onsubmit = (e) => { e.preventDefault(); kirim(); };

// Tombol di halaman yang membuka chat
document.querySelectorAll('.chips button').forEach((b) => {
  b.onclick = () => buka(() => { setMode('tanya'); text.value = b.dataset.q; kirim(); });
});
$('heroForm').onsubmit = (e) => {
  e.preventDefault();
  const q = $('heroInput').value.trim();
  if (!q) return;
  $('heroInput').value = '';
  buka(() => { setMode('tanya'); text.value = q; kirim(); });
};
document.querySelectorAll('.modes button').forEach((b) => {
  b.onclick = () => buka(() => setMode(b.dataset.mode));
});
