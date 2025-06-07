# Hallo - Aplikasi Chat Modern

Hallo adalah aplikasi chat modern yang dibangun dengan Next.js dan Firebase. Aplikasi ini memiliki antarmuka yang mirip dengan WhatsApp dan mendukung fitur-fitur utama aplikasi chat.

## Fitur Utama

- 🔐 Autentikasi pengguna (Email/Password dan Google)
- 💬 Chat real-time
- 👤 Manajemen kontak
- 🔔 Status pesan (terkirim/dibaca)
- 📱 Responsive design (mobile-friendly)
- 🤖 Chat dengan AI - berbicara dengan asisten AI seperti di WhatsApp dengan Meta AI
- 🌐 Terjemahkan Teks - menerjemahkan teks ke berbagai bahasa
- ⚙️ Pengaturan AI - mengatur model AI, bahasa default, dan instruksi khusus
- 📞 Panggilan Video dan Audio - komunikasi real-time dengan pengguna lain
- 📱 Status/Story - berbagi konten sementara dengan kontak (seperti WhatsApp Story)
- 📁 Berbagi File dan Media - mengirim file dan gambar ke kontak
- 🌓 Multi-bahasa - dukungan i18n dengan berbagai bahasa

## Teknologi

- Next.js 14+
- TypeScript
- Firebase (Authentication, Firestore, Storage)
- Tailwind CSS
- React Icons
- OpenRouter API dengan Qwen (untuk chat dengan AI)
- Google Translate API (untuk fitur terjemahan)
- WebRTC & SimplePeer (untuk fitur panggilan video/audio)
- Cloudinary (untuk penyimpanan media)
- i18next (untuk dukungan multi-bahasa)
- Howler (untuk pemutaran suara)

## Progress Pengembangan

### ✅ Fitur yang Sudah Diimplementasikan:
- **Autentikasi Pengguna**: Login dengan email/password dan Google
- **Chat Real-time**: Percakapan one-to-one dengan kontak
- **Manajemen Kontak**: Tambah, lihat, dan kelola kontak
- **Status Pesan**: Indikator terkirim/dibaca untuk pesan
- **Fitur AI Chat**: Integrasi dengan OpenRouter API (Qwen)
- **Fitur Terjemahan**: Terjemahkan teks ke berbagai bahasa
- **Panggilan Video/Audio**: Komunikasi real-time dengan WebRTC
- **Fitur Story/Status**: Berbagi konten sementara seperti WhatsApp Story
- **Berbagi Media**: Unggah dan kirim gambar dengan Cloudinary
- **Multi-bahasa**: Dukungan internasionalisasi dengan i18next

### 🔧 Perbaikan Terbaru:
- Pengoptimalan stabilitas panggilan video/audio
- Penanganan race condition dalam signaling WebRTC
- Peningkatan kualitas UX untuk fitur Story
- Integrasi Cloudinary untuk penyimpanan media yang lebih efisien
- Implementasi i18next untuk dukungan multi-bahasa

### 🚀 Fitur Yang Akan Datang:
- Peningkatan fitur grup chat
- End-to-end encryption
- Tema gelap (dark mode)
- Screen sharing dalam panggilan video
- Peningkatan fitur pencarian

## Cara Penggunaan

### Prasyarat
- Node.js 18+ 
- Akun Firebase
- Akun OpenRouter (untuk fitur AI)
- Project Google Cloud (untuk fitur terjemahan)
- Akun Cloudinary (untuk penyimpanan media)

### Langkah Instalasi

1. Clone repositori
```bash
git clone https://github.com/username/hallo.git
cd hallo
```

2. Install dependensi
```bash
npm install
```

3. Buat proyek di Firebase dan dapatkan konfigurasi
   - Buat proyek baru di [Firebase Console](https://console.firebase.google.com)
   - Aktifkan Authentication (Email/Password dan Google)
   - Aktifkan Firestore Database
   - Aktifkan Storage
   - Buat aplikasi Web dan salin konfigurasinya

4. Buat file .env.local di root proyek dan tambahkan konfigurasi Firebase Anda:
```bash
# Firebase Config
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# OpenRouter Qwen API - Dapatkan di https://openrouter.ai/keys
NEXT_QWEN_API_KEY=your_openrouter_api_key_here
NEXT_QWEN_API_ENDPOINT=https://openrouter.ai/api/v1/chat/completions

# Google Translate Config - Dapatkan dari Google Cloud Console
GOOGLE_TRANSLATE_PROJECT_ID=your_google_project_id_here
GOOGLE_TRANSLATE_LOCATION=global
GOOGLE_TRANSLATE_CREDENTIALS={"type":"service_account",...} # Credentials Service Account JSON

# Cloudinary Config - Dapatkan dari Cloudinary Dashboard
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
NEXT_PUBLIC_CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

5. Jalankan aplikasi
```bash
npm run dev
```

6. Buka http://localhost:3000 di browser

## Struktur Proyek

```
/src
  /app           # Pages dan routes
    /api         # API endpoints
    /login       # Halaman login
    /profile     # Halaman profil
  /components    # React components
    /Story       # Komponen untuk fitur Status/Story
  /firebase      # Firebase config dan utilities
  /lib           # Utility functions dan hooks
    /hooks       # React hooks
  /types         # TypeScript type definitions
/public          # Aset statis
```

## Fitur AI dan Terjemahan

### Cara Mendapatkan API Key:

#### OpenRouter API Key:
1. Buat akun di [OpenRouter](https://openrouter.ai/)
2. Buka bagian API Keys di dashboard
3. Buat API key baru dan salin ke `.env.local`

#### Google Translate API:
1. Buat project di [Google Cloud Console](https://console.cloud.google.com/)
2. Aktifkan Cloud Translation API
3. Buat Service Account dan download kunci JSON
4. Salin isi file JSON ke variabel `GOOGLE_TRANSLATE_CREDENTIALS`

#### Cloudinary API:
1. Buat akun di [Cloudinary](https://cloudinary.com/)
2. Dapatkan Cloud name, API Key, dan API Secret dari dashboard
3. Salin informasi ke variabel lingkungan di `.env.local`

### Cara Menggunakan Fitur:

1. **Chat dengan AI**: Klik ikon chat di sidebar untuk membuka jendela chat dengan AI
2. **Terjemahan**: Klik ikon globe di sidebar untuk membuka jendela terjemahan
3. **Pengaturan AI**: Klik tombol "Pengaturan AI" di bagian bawah sidebar untuk:
   - Memilih model Qwen (berbagai model tersedia, beberapa gratis)
   - Mengatur bahasa default
   - Mengaktifkan/menonaktifkan terjemahan otomatis
   - Menambahkan instruksi khusus untuk AI
4. **Panggilan Video/Audio**: Klik ikon telepon (audio) atau video di header chat untuk memulai panggilan
5. **Status/Story**: Klik pada avatar di sidebar atau gunakan tombol "+" di bagian Status untuk membuat story baru

## Kontribusi

Kontribusi dan saran sangat diterima! Silakan buat issue atau pull request untuk perbaikan atau penambahan fitur.

## Lisensi

MIT