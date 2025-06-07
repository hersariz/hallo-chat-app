# Panduan Fitur Telepon dan Video Call

## Perubahan yang Dilakukan

1. **Perbaikan Sistem Signaling**
   - Mengganti pendekatan localStorage dengan Firestore untuk signaling yang lebih handal
   - Mengimplementasikan sistem status panggilan yang lebih jelas (ringing → answered → connected → ended)
   - Menyederhanakan alur WebRTC dengan fokus pada stabilitas koneksi

2. **Perbaikan Audio Ringtone**
   - Mengganti data URI dengan file audio statis di folder `public/sounds/ringtone.mp3`
   - Menambahkan fallback jika Howler.js tidak dapat memainkan audio
   - Menambahkan penanganan untuk aturan autoplay browser

3. **Perbaikan SimplePeer dan WebRTC**
   - Mengoptimalkan konfigurasi ICE servers dan TURN
   - Membatasi jumlah kandidat ICE untuk mengurangi overhead
   - Memperbaiki handling signal data untuk menghindari race condition

4. **Perbaikan UI dan UX**
   - Memperbaiki transisi antar status panggilan
   - Menambahkan timeout yang lebih cerdas untuk panggilan tidak terjawab
   - Memastikan resource dibersihkan dengan benar saat panggilan berakhir

5. **Penanganan Error dan Stabilitas**
   - Menambahkan penanganan error yang lebih baik di setiap tahap
   - Menggunakan sistem referensi (useRef) untuk mencegah memory leak
   - Mencegah panggilan berulang ke fungsi seperti endCall

## Cara Menguji

1. **Siapkan Ringtone**:
   - Pastikan Anda memiliki file MP3 untuk ringtone di folder `public/sounds/ringtone.mp3`
   - Jika belum, unduh dari internet atau gunakan file MP3 yang sudah ada

2. **Panggilan Keluar**:
   - Login ke aplikasi dengan dua perangkat berbeda (atau browser berbeda)
   - Mulai panggilan dari perangkat A ke perangkat B dengan menekan ikon telepon atau video
   - Perangkat B akan menerima notifikasi panggilan masuk

3. **Menerima Panggilan**:
   - Tekan tombol "Terima" untuk menjawab panggilan
   - Sistem akan mengatur koneksi WebRTC dan streaming media
   - Setelah terhubung, Anda bisa berkomunikasi melalui suara atau video

4. **Konfigurasi yang Dibutuhkan**:
   - Pastikan browser Anda mengizinkan akses ke kamera dan mikrofon
   - Pastikan firewall tidak memblokir koneksi WebRTC
   - Untuk penggunaan di belakang NAT/router, server TURN diperlukan (sudah dikonfigurasi)

5. **Troubleshooting**:
   - Jika panggilan gagal terhubung, periksa konsol browser untuk error
   - Periksa apakah kedua perangkat memiliki akses internet yang baik
   - Coba lakukan panggilan dengan menggunakan koneksi WiFi yang sama untuk menguji

## Status Panggilan

- **ringing**: Panggilan sedang diinisiasi, menunggu penerima menjawab
- **answered**: Penerima telah menjawab, sedang menyiapkan koneksi peer
- **connected**: Koneksi peer berhasil, media sedang ditransmisikan
- **declined**: Penerima menolak panggilan
- **ended**: Panggilan telah diakhiri oleh salah satu pihak
- **failed**: Terjadi error dalam proses koneksi

## Referensi Teknis

- WebRTC: https://webrtc.org/
- SimplePeer: https://github.com/feross/simple-peer
- Howler.js: https://howlerjs.com/ 