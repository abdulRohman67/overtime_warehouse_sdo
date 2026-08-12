OVERTIME SYSTEM - VERSI REVISI

Fitur:
1. Admin CRUD akun.
2. Admin CRUD overtime.
3. Admin menentukan overtime berdasarkan SAP ID user.
4. User hanya melihat overtime miliknya.
5. History dengan filter tanggal.
6. History download Excel dan PDF.
7. Akumulasi overtime berdasarkan periode, hanya untuk akun user.
8. Admin memiliki page Summary Overtime per user berdasarkan periode dan dapat download Excel/PDF.
8. Chat terpisah per user.
9. Dashboard statistik.
10. Tidak memakai common.js.
11. HTML dan JS dipisah.
12. Firebase Realtime Database, bukan Firestore.

SETUP
1. Buka js/firebase.js.
2. Ganti ISI_API_KEY, ISI_PROJECT, ISI_SENDER_ID, dan ISI_APP_ID dengan konfigurasi Web App Firebase Anda.
3. Pastikan Realtime Database sudah dibuat.
4. Struktur database:
users/{sapId} = {name,password,role}
overtime/{autoId} = {date,start,end,hours,userSap,note,updatedAt}
chats/{userSap}/{autoId} = {from,name,message,createdAt}

AKUN CONTOH
users
  10001
    name: Admin
    password: admin123
    role: admin
  20001
    name: User Satu
    password: user123
    role: user

CATATAN KEAMANAN
Versi ini mengikuti permintaan SAP ID + password langsung di Realtime Database.
Untuk produksi, jangan gunakan Firebase Rules .read/.write true. Buat rules yang membatasi akses. Password plaintext juga tidak disarankan untuk sistem produksi.
