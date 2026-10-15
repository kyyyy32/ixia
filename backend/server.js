import path from 'path';
import 'dotenv/config';
import express from 'express';
import multer from 'multer';
import { GoogleGenAI } from '@google/genai';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 4 * 1024 * 1024 } });
const app = express();
app.use(express.json());
app.use(express.static(path.join(process.cwd(), 'public')));

const gemini = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const MODEL_NAME = process.env.MODEL_NAME || 'gemini-3.5-flash-lite';
const PORT = process.env.PORT || 3000;

// ===== SYSTEM INSTRUCTION =====
const SISTEM = `Kamu adalah Asisten AI SMK Budi Utomo.
Jawab dalam bahasa Indonesia yang ramah, jelas, dan ringkas.
Untuk pertanyaan tentang sekolah (jadwal, biaya, pendaftaran), jangan mengarang data; arahkan pengguna menghubungi sekolah.
Untuk pelajaran umum, jelaskan dengan contoh sederhana.`;

const tanyaGemini = async (contents) => {
  const hasil = await gemini.models.generateContent({
    model: MODEL_NAME,
    contents,
    config: { systemInstruction: SISTEM },
  });
  return hasil.text;
};

const berkas = (f) => ({
  inlineData: { data: f.buffer.toString('base64'), mimeType: f.mimetype },
});

const gagal = (res, error, pesan) => {
  console.error(error);
  if (error?.status === 503) {
    return res.status(503).json({ error: 'Server AI sedang sibuk. Coba lagi 1 menit.' });
  }
  res.status(500).json({ error: pesan });
};

// 1. Teks
app.post('/tanya-ai', async (req, res) => {
  const { pertanyaan } = req.body;
  if (!pertanyaan) return res.status(400).json({ error: 'Pertanyaan wajib diisi!' });
  try {
    res.json({ jawaban: await tanyaGemini(pertanyaan) });
  } catch (error) {
    gagal(res, error, 'Gagal memproses API Gemini');
  }
});

// 2. Gambar
app.post('/analisis-gambar', upload.single('gambar'), async (req, res) => {
  const instruksi = req.body.instruksi || 'Jelaskan gambar ini';
  if (!req.file) return res.status(400).json({ error: 'Gambar wajib diunggah!' });
  try {
    res.json({ analisis: await tanyaGemini([instruksi, berkas(req.file)]) });
  } catch (error) {
    gagal(res, error, 'Gagal menganalisis gambar');
  }
});

// 3. Dokumen
app.post('/analisis-dokumen', upload.single('dokumen'), async (req, res) => {
  const instruksi = req.body.instruksi || 'Ringkas dokumen ini';
  if (!req.file) return res.status(400).json({ error: 'Dokumen wajib diunggah!' });
  try {
    res.json({ analisis_dokumen: await tanyaGemini([instruksi, berkas(req.file)]) });
  } catch (error) {
    gagal(res, error, 'Gagal menganalisis dokumen');
  }
});

// 4a. Audio
app.post('/transkrip-audio', upload.single('audio'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Audio wajib diunggah!' });
  try {
    const instruksi = 'Transkripsikan audio ini ke teks apa adanya, lalu beri ringkasan satu kalimat.';
    res.json({ transkrip: await tanyaGemini([instruksi, berkas(req.file)]) });
  } catch (error) {
    gagal(res, error, 'Gagal mentranskrip audio');
  }
});

// 4b. Video
app.post('/analisis-video', upload.single('video'), async (req, res) => {
  const instruksi = req.body.instruksi || 'Jelaskan isi video ini';
  if (!req.file) return res.status(400).json({ error: 'Video wajib diunggah!' });
  try {
    res.json({ analisis_video: await tanyaGemini([instruksi, berkas(req.file)]) });
  } catch (error) {
    gagal(res, error, 'Gagal menganalisis video');
  }
});

// 5. Ide gambar
app.post('/buat-gambar', async (req, res) => {
  const { deskripsi } = req.body;
  if (!deskripsi) return res.status(400).json({ error: 'Deskripsi wajib diisi!' });
  try {
    const hasil = await tanyaGemini(
      `Buatkan panduan prompt gambar AI yang detail, instruksi pencahayaan, aspek rasio, dan kata kunci estetik berdasarkan konsep: ${deskripsi}`
    );
    res.json({ status: 'Sukses', detail_resep_ai: hasil });
  } catch (error) {
    gagal(res, error, 'Gagal memproses permintaan');
  }
});

// Jalan lokal saja; di Vercel tidak memakai listen
if (!process.env.VERCEL) {
  app.listen(PORT, () => console.log(`Server jalan di http://localhost:${PORT}`));
}

export default app;