import { db } from "./firebase.js";
import {
    ref,
    get
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-database.js";
import { requireLogin } from "./nav.js";

async function loadDashboard() {
    const s = requireLogin();

    if (!s) return;

    try {
        // Ambil data overtime dan users
        const [os, us] = await Promise.all([
            get(ref(db, "overtime")),
            get(ref(db, "users"))
        ]);

        // Data overtime
        const data = os.exists()
            ? Object.values(os.val())
            : [];

        // Filter data berdasarkan role
        const visible = data.filter(x =>
            s.role === "admin" || x.userSap === s.sapId
        );

        // Total overtime
        const totalOt = document.getElementById("totalOt");

        if (totalOt) {
            totalOt.textContent = visible.length;
        }

        // Total jam overtime
        const totalHours = document.getElementById("totalHours");

        if (totalHours) {
            totalHours.textContent = visible.reduce(
                (n, x) => n + Number(x.hours || 0),
                0
            );
        }

        // Total user
        const totalUsers = document.getElementById("totalUsers");

        if (totalUsers) {
            totalUsers.textContent = us.exists()
                ? Object.values(us.val()).filter(
                    x => x.role === "user"
                ).length
                : 0;
        }

        // Pesan selamat datang
        const welcome = document.getElementById("welcome");

        if (welcome) {
            if (s.role === "admin") {
                welcome.innerHTML = `
                    Selamat datang, <b>${s.name}</b>.
                    Anda memiliki akses penuh untuk mengelola akun dan overtime.
                `;
            } else {
                welcome.innerHTML = `
                    Selamat datang, <b>${s.name}</b>.

                    <div style="
                        color: red;
                        margin-top: 10px;
                        line-height: 1.8;
                    ">
                        <div>
                            1. OT Agustus - September yaitu 11 Agustus 20296 s/d 9 September 2026
                        </div>

                        <div style="padding-left: 20px;">
                            OT Tanggal 09 September 2026 Masuk OT Manual
                        </div>

                        <div style="margin-top: 8px;">
                            2. OT September - Oktober yaitu 10 September 2026 s/d 11 Oktober 2026
                        </div>

                        <div style="padding-left: 20px;">
                            OT Tanggal 9,10,11 Oktober 2026 Masuk OT Manual
                        </div>
                    </div>
                `;
            }
        }

    } catch (error) {
        console.error("Gagal memuat dashboard:", error);
    }
}

loadDashboard();
