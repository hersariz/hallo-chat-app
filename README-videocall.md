# Fitur Panggilan Video dan Audio

## Deskripsi Fitur
Aplikasi Hallo menyediakan fitur panggilan video dan audio yang memungkinkan pengguna untuk melakukan komunikasi real-time dengan pengguna lainnya. Fitur ini menggunakan WebRTC untuk komunikasi peer-to-peer yang aman dan berkualitas tinggi.

## Komponen Utama
1. **VideoCallModal.tsx** - Komponen utama yang menangani panggilan video dan audio
2. **IncomingCallModal.tsx** - Komponen untuk menampilkan notifikasi panggilan masuk
3. **ChatApp.tsx** - Mengatur state dan routing panggilan di tingkat aplikasi
4. **ChatWindow.tsx** - Menyediakan tombol untuk memulai panggilan

## Teknologi yang Digunakan
- **WebRTC** - Teknologi untuk komunikasi real-time
- **SimplePeer** - Wrapper untuk WebRTC yang menyederhanakan implementasi
- **Firebase Firestore** - Digunakan untuk signaling antara pengguna

## Cara Kerja Signaling
1. Penelepon membuat dokumen 'call' di Firestore dengan status 'ringing'
2. Penerima panggilan memantau koleksi Firestore untuk panggilan masuk
3. Saat penerima menjawab, status diubah menjadi 'answered'
4. Penelepon dan penerima saling bertukar data WebRTC (offer/answer) melalui Firestore
5. Setelah koneksi terbentuk, komunikasi berlangsung peer-to-peer

## Perbaikan yang Dilakukan

### 1. Masalah Koneksi dan Race Condition
- Ditambahkan `signalingLockRef` untuk mencegah pemrosesan sinyal ganda
- Implementasi sistem timestamp untuk melacak offer/answer terbaru
- Mekanisme retry otomatis untuk mengatasi error "InvalidStateError"
- Limit retry untuk mencegah loop tak terbatas

### 2. Penanganan Modal dan State
- Ditambahkan state `isModalReady` untuk memastikan modal benar-benar dimuat
- Delay yang tepat sebelum inisialisasi untuk mencegah race condition UI
- Pemisahan state dan flag yang jelas (`hasActionTakenRef`, `actionInProgressRef`) pada IncomingCallModal

### 3. Penanganan Media
- Perbaikan permintaan akses media dengan constraint yang lebih baik
- Pembersihan resource secara menyeluruh saat panggilan berakhir
- Fallback untuk perangkat yang tidak mendukung constraint tertentu

### 4. Pengoptimalan untuk Mode Pengujian
- Konstanta `SINGLE_DEVICE_TESTING` untuk pengujian di perangkat yang sama
- Delay yang lebih lama untuk melepaskan sumber daya media

### 5. Deteksi dan Penanganan Kualitas Jaringan
- Monitoring statistik WebRTC secara real-time
- Indikator kualitas koneksi (baik/sedang/buruk)
- Notifikasi kepada pengguna ketika koneksi lambat

### 6. Mekanisme Recovery
- Fungsi `refreshConnection()` untuk reset dan membangun ulang koneksi
- Strategi yang berbeda untuk error yang berbeda
- Pemulihan otomatis dalam beberapa situasi

## Konfigurasi ICE Servers
```javascript
const iceServers = [
  { urls: 'stun:stun.l.google.com:19302' }, // Google STUN server
  { urls: 'stun:stun1.l.google.com:19302' }, // Backup STUN server
  { 
    urls: 'turn:openrelay.metered.ca:80', // TURN server untuk melintasi NAT
    username: 'openrelayproject',
    credential: 'openrelayproject'
  },
  {
    urls: 'turn:global.turn.twilio.com:3478?transport=udp', // Twilio TURN server
    username: '...', // Credential Twilio
    credential: '...'
  }
];
```

## Konstanta untuk Stabilitas
```javascript
const MODAL_INIT_DELAY = 300;       // Waktu tunggu sebelum inisialisasi koneksi
const SIGNALING_LOCK_RELEASE = 2000; // Waktu untuk membuka signaling lock
const CALL_TIMEOUT = 30000;          // Waktu maksimum menunggu jawaban panggilan
const ANSWER_TIMEOUT = 15000;        // Waktu tunggu setelah panggilan dijawab
const RETRY_BASE_DELAY = 1500;       // Delay dasar untuk retry
const MAX_RETRIES = 3;               // Batas maksimum retry
```

## Cara Penggunaan
1. Klik ikon telepon (untuk audio) atau video di header chat
2. Tunggu penerima menjawab panggilan
3. Untuk menerima panggilan, klik "Terima" pada modal panggilan masuk
4. Selama panggilan, Anda dapat:
   - Mematikan/menyalakan mikrofon
   - Mematikan/menyalakan kamera (untuk panggilan video)
   - Mengakhiri panggilan
   - Melihat indikator kualitas koneksi

## Troubleshooting
- **Panggilan gagal tersambung**: Pastikan kedua pengguna memiliki koneksi internet yang stabil
- **Tidak ada suara**: Periksa izin mikrofon dan pengaturan suara perangkat
- **Tidak ada video**: Periksa izin kamera dan pastikan tidak digunakan aplikasi lain
- **Kualitas buruk**: Indikator koneksi akan menampilkan ikon merah jika koneksi buruk

## Batasan dan Pengembangan ke Depan
- Saat ini kualitas video diatur pada 640x480 untuk memastikan kompatibilitas
- Belum ada fitur screen sharing
- Panggilan grup belum didukung (hanya one-to-one)
