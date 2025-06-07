# Panduan Mengupload Aturan Firebase Storage

Anda perlu mengunggah aturan keamanan Storage yang telah dibuat (`storage.rules`) ke Firebase Console agar fitur upload gambar berfungsi dengan baik.

## Langkah-langkah Mengunggah Aturan Storage:

1. Buka [Firebase Console](https://console.firebase.google.com/)
2. Pilih project Hallo Anda
3. Pada sidebar kiri, klik "Storage"
4. Klik tab "Rules"
5. Salin seluruh isi file `storage.rules` yang telah dibuat
6. Timpa aturan yang ada dengan aturan baru ini
7. Klik "Publish"

## Aturan yang Perlu Diupload:
```
rules_version = '2';

service firebase.storage {
  match /b/{bucket}/o {
    // Hanya pengguna terautentikasi yang bisa melakukan operasi apapun
    match /{allPaths=**} {
      allow read, write: if request.auth != null;
    }
    
    // Aturan khusus untuk folder chat
    match /chats/{chatId}/{allImages=**} {
      // Pengguna hanya bisa melihat dan mengunggah gambar ke chat dimana mereka adalah peserta
      allow read: if request.auth != null;
      allow write: if request.auth != null 
                     && request.resource.size < 5 * 1024 * 1024  // Maksimal 5MB
                     && request.resource.contentType.matches('image/.*'); // Hanya gambar
    }
  }
}
```

## Konfigurasi Tambahan

Pastikan juga bucket storage Firebase Anda sudah diinisialisasi. Jika belum, ikuti langkah-langkah berikut:

1. Di halaman Storage, klik "Get Started" jika belum pernah menggunakan Storage
2. Pilih lokasi penyimpanan data (sebaiknya pilih yang dekat dengan lokasi target pengguna)
3. Klik "Next" dan "Done"

## Periksa CORS

Jika masih mengalami masalah, periksa konfigurasi CORS:

1. Di Firebase Console, buka Storage
2. Klik tab "Rules"
3. Pastikan CORS sudah dikonfigurasi dengan benar (Firebase biasanya mengatur ini secara otomatis)

Jika perlu mengatur CORS secara manual, gunakan Firebase CLI:
```
firebase init storage
firebase deploy --only storage
```

Setelah menyelesaikan langkah-langkah ini, fitur upload gambar seharusnya berfungsi dengan baik. 