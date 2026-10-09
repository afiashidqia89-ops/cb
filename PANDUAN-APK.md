# Membuat APK Android "Cek Blok" (Capacitor + GitHub Actions)

APK dibuat otomatis di server GitHub, jadi tidak perlu Android Studio atau PC.

## Isi paket
| Berkas | Fungsi |
|---|---|
| `index.html`, `service-worker.js` | Aplikasi versi terbaru (v26) – timpa yang lama |
| `capacitor.config.json`, `package.json` | Pengaturan pembungkus Android |
| `scripts/patch-android.sh` | Menambah izin GPS/kamera, nomor versi, ikon, splash |
| `.github/workflows/build-apk.yml` | Mesin pembuat APK |

## Langkah 1 – Unggah ke repo `Plant-Digital`
Salin semua berkas di atas ke **akar repo** (di samping `manifest.json` dan ikon yang sudah ada). Folder `.github` dan `scripts` harus ikut dengan struktur yang sama. Lewat browser HP: *Add file → Create new file*, ketik nama dengan garis miring (mis. `.github/workflows/build-apk.yml`), lalu tempel isinya.

## Langkah 2 – Buat token (sekali saja)
Token dipakai agar kunci tanda tangan APK dibuat dan disimpan otomatis, tanpa pernah ditampilkan.
1. GitHub → foto profil → **Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token**.
2. *Repository access*: **Only select repositories** → `Plant-Digital`.
3. *Repository permissions*: **Secrets → Read and write**. Klik Generate, lalu salin tokennya.
4. Di repo: **Settings → Secrets and variables → Actions → New repository secret**. Nama: `GH_PAT`, isi: token tadi.

## Langkah 3 – Jalankan build
Repo → tab **Actions** → **Build APK** → **Run workflow**. Tunggu sekitar 8–15 menit.
Hasil: halaman **Releases** (file `Cek-Blok.apk`, mudah diunduh dari HP) dan *Artifacts* di run tersebut.
Pada run pertama, kunci tanda tangan dibuat dan disimpan sebagai secret `ANDROID_KEYSTORE_BASE64` dan `ANDROID_KEYSTORE_PASSWORD`. Setelah itu `GH_PAT` boleh dihapus.

## Langkah 4 – Pasang di HP
Unduh `Cek-Blok.apk`, buka, izinkan "Instal dari sumber ini", lalu pasang. Saat pertama dipakai, izinkan **Lokasi** dan **Kamera**.

## Memperbarui aplikasi
Ubah `index.html`, lalu jalankan **Build APK** lagi. Selama kunci tersimpan, APK baru langsung menimpa yang lama tanpa uninstall dan data tetap aman. Nomor versi naik otomatis.
Jangan hapus secret `ANDROID_KEYSTORE_*`. Kalau hilang, kunci baru dibuat dan APK harus di-uninstall dulu (data lokal ikut hilang).

## Hal yang perlu diketahui
- **Data PWA tidak pindah ke APK.** Riwayat di browser/PWA tersimpan terpisah dari aplikasi Android. Ekspor dulu (Excel) bila perlu.
- **Ekspor Excel / PDF / GeoJSON** membuka menu *Bagikan* Android (simpan ke Files/Drive, kirim WhatsApp, atau langsung pilih **Avenza Maps** untuk GeoPDF).
- **Tombol Cetak disembunyikan** di APK karena WebView tidak mendukung cetak. Pakai Ekspor Excel atau Ekspor PDF Peta.
- Tombol **Kembali** Android: kembali ke Beranda dulu, baru keluar.
- Opsi `kunci_sementara` pada workflow hanya untuk uji coba cepat tanpa token. APK-nya tidak bisa menimpa versi berikutnya.
- Repo publik berarti halaman Releases juga publik (sama seperti situs Pages Anda saat ini).

## Bila build gagal
Buka run yang merah di tab Actions, lihat langkah yang bertanda ✗, lalu kirim teks error-nya.
