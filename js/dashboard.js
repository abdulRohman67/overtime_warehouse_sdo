```javascript
import { db } from "./firebase.js";
import {
    ref,
    get
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-database.js";
import { requireLogin } from "./nav.js";

// Periksa login pengguna
const s = requireLogin();

if (s) {
    // Ambil data overtime dan users secara bersamaan
    const [os, us] = await Promise.all([
        get(ref(db, "overtime")),
        get(ref(db, "users"))
    ]);

    // Ambil data overtime
    const data = os.exists()
        ? Object.values(os.val())
        : [];

    // Filter data sesuai role pengguna
    const visible = data.filter(x =>
        s.role === "admin" || x.userSap === s.sapId
    );

    // Tampilkan total data overtime
    totalOt.textContent = visible.length;

    // Hitung total jam overtime
    totalHours.textContent = visible.reduce(
        (total, x) => total + Number(x.hours || 0),
        0
    );

    // Hitung total pengguna dengan role user
    totalUsers.textContent = us.exists()
        ? Object.values(us.val()).filter(
            x => x.role === "user"
        ).length
        : 0;

    // Tampilkan pesan selamat datang
    welcome.innerHTML = `
        Selamat datang, <b>${s.name}</b>.
        ${
            s.role === "admin"
                ? "Anda memiliki akses penuh untuk mengelola akun dan overtime."
                 : "Untuk OT yang terjadi pada tanggal 9,10,11 Okober 2026 Masuk ke OT Manual."
             
        }
    `;
}
```
