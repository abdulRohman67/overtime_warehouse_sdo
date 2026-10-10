```javascript
import { db } from "./firebase.js";
import {
    ref,
    get
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-database.js";
import { requireLogin } from "./nav.js";

// Cek login
const s = requireLogin();

if (s) {
    // Ambil data overtime dan users
    const [os, us] = await Promise.all([
        get(ref(db, "overtime")),
        get(ref(db, "users"))
    ]);

    // Ambil seluruh data overtime
    const data = os.exists()
        ? Object.values(os.val())
        : [];

    // Filter data berdasarkan role
    const visible = data.filter(x =>
        s.role === "admin" || x.userSap === s.sapId
    );

    // Tampilkan total overtime
    totalOt.textContent = visible.length;

    // Hitung total jam overtime
    totalHours.textContent = visible.reduce(
        (n, x) => n + Number(x.hours || 0),
        0
    );

    // Hitung total user
    totalUsers.textContent = us.exists()
        ? Object.values(us.val()).filter(
            x => x.role === "user"
        ).length
        : 0;

    // Tampilkan ucapan selamat datang
    welcome.innerHTML = `
        Selamat datang, <b>${s.name}</b>.
        ${
            s.role === "admin"
                ? "Anda memiliki akses penuh untuk mengelola akun dan overtime."
                : "Anda hanya dapat melihat data overtime milik Anda."
        }
    `;
}
```
