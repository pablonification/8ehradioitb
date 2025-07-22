# Dokumentasi Website 8EH Radio ITB

Dokumentasi ini ditujukan untuk para pengguna dashboard admin Website 8EH Radio ITB.

## [KRU] Masuk ke Dashboard Admin 8EH Radio ITB

Pastikan sebelum masuk ke dashboard, kalian sudah melakukan input email kalian ke link berikut: https://8eh.link/data-email-website8EH agar email kalian di-whitelist untuk bisa sign in ke Dashboard 8EH Radio ITB.

1.  Pergi ke link berikut: https://8ehradioitb.com/dashboard
2.  Tekan tombol “Log in with Google Account”.
3.  Pilih/gunakan email yang sudah di-input ke form tersebut.
4.  Jika langsung terbuka menu dashboard berarti proses sign in sudah berhasil.

**Catatan:** Tolong cek menu sidebar kalian. Jika pada sidebar kalian hanya terlihat menu home dan links (lihat gambar dibawah), artinya akun kalian belum di-assign ke role divisi yang seharusnya.

Agar akun kalian bisa di-assign ke role yang sesuai divisi kalian tolong hubungi kontak berikut, id line: @arqilasp12.

## [KRU] Membuat short link dengan domain 8eh.link

Untuk membuat short link dari link yang panjang dengan menggunakan domain `8eh.link`, bisa dilakukan dengan cara:

1.  Pada dashboard, buka sidebar dan buka bagian “Links”.
2.  Masukkan URL yang ingin digunakan di kolom `Destination URL` dan data lainnya jika diperlukan.
3.  Klik `Create Link` jika sudah selesai. Link yang telah dibuat akan muncul di tabel di bawah form.

---

## [REPORTER] Mengelola Konten Blog

Role `REPORTER` memiliki akses untuk menambah, mengubah, dan menghapus artikel pada blog 8EH Radio ITB.

### Membuat Artikel Baru

1.  Dari sidebar, navigasi ke menu `Blog`.
2.  Klik tombol `New Post` di pojok kanan atas.
3.  Anda akan diarahkan ke halaman editor artikel.
4.  Isi judul artikel, slug (URL), dan konten artikel.
5.  Anda dapat mengunggah gambar untuk thumbnail artikel.
6.  Klik `Create Post` untuk mempublikasikan artikel.

### Mengubah Artikel

1.  Dari sidebar, navigasi ke menu `Blog`.
2.  Di daftar artikel, temukan artikel yang ingin diubah.
3.  Klik tombol `Edit` di samping artikel tersebut.
4.  Lakukan perubahan pada form yang tersedia.
5.  Klik `Update Post` untuk menyimpan perubahan.

---

## [MUSIC] Mengelola Tune Tracker

Role `MUSIC` bertanggung jawab untuk mengelola data lagu yang diputar di radio.

1.  Dari sidebar, navigasi ke menu `Tune Tracker`.
2.  Di sini Anda dapat melihat daftar lagu yang sudah ada.
3.  Untuk menambahkan data pemutaran lagu baru, isi form di bagian atas halaman dengan judul lagu dan nama artis.
4.  Klik `Submit` untuk menambahkan.
5.  Anda juga dapat mengunggah file `.csv` berisi daftar lagu dengan mengikuti format yang ditentukan. Klik `Choose File` untuk memilih file dan `Upload CSV` untuk mengunggah.

---

## [TECHNIC] Konfigurasi Teknis

Role `TECHNIC` memiliki akses ke beberapa pengaturan teknis website.

### Mengelola Konfigurasi Stream

1.  Navigasi ke `Stream Config` di sidebar.
2.  Di halaman ini, Anda dapat melihat dan mengubah URL stream radio utama.
3.  Masukkan URL stream yang baru pada kolom `Stream URL` dan klik `Save`.

### Mengelola Podcast

1.  Buka menu `Podcast` dari sidebar.
2.  Halaman ini memungkinkan Anda untuk menambah dan menghapus episode podcast.
3.  Untuk menambah podcast baru, isi informasi seperti judul, deskripsi, dan upload file audio serta gambar thumbnail.
4.  Klik `Upload Podcast` untuk menyimpan.

### Mengelola Konfigurasi Player

1.  Buka `Player Config` di sidebar.
2.  Di sini Anda dapat mengubah judul dan deskripsi yang tampil pada radio player di halaman utama.
3.  Ubah teks pada kolom yang tersedia dan klik `Save` untuk menerapkan perubahan.

### Mengelola Video Program

1.  Akses menu `Program Videos` dari sidebar.
2.  Di halaman ini, Anda dapat mengunggah video program baru dengan mengisi judul, deskripsi, dan menyertakan link video YouTube serta file thumbnail.
3.  Klik `Add Video` untuk menambahkan video ke halaman program.

---

## [DEVELOPER] Akses Administratif

Role `DEVELOPER` memiliki hak akses tertinggi dan dapat mengelola semua aspek dari dashboard.

### Mengelola Pengguna dan Role

1.  Buka `Users` dari sidebar.
2.  Di halaman ini, Anda akan melihat daftar semua pengguna yang terdaftar.
3.  Anda dapat mengubah role setiap pengguna dengan memilih role yang tersedia (`DEVELOPER`, `TECHNIC`, `REPORTER`, `KRU`, `MUSIC`).
4.  Klik `Save` pada baris pengguna untuk menyimpan perubahan role.

### Mengelola Whitelist Email

1.  Buka `Whitelist` dari sidebar.
2.  Halaman ini berisi daftar email yang diizinkan untuk masuk ke dashboard.
3.  Anda dapat menambah email baru dengan memasukkannya ke dalam form dan mengklik `Add Email`.
4.  Anda juga bisa menghapus email dari whitelist dengan mengklik `Delete` di samping email yang bersangkutan.
5.  Terdapat fitur `Sync with Google Form` untuk menyinkronkan whitelist dengan data dari Google Form yang telah di-setup.
