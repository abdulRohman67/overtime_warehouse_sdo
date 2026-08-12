// =====================================================
// NAV.JS
// NAVIGASI SIDEBAR + IDENTITAS USER
// =====================================================

import {
    getSession,
    logout,
    esc
} from "./session.js";


// =====================================================
// REQUIRE LOGIN
// =====================================================

export function requireLogin() {

    const s = getSession();

    // -------------------------------------------------
    // BELUM LOGIN
    // -------------------------------------------------

    if (!s) {
        window.location.href = "index.html";
        return null;
    }


    // -------------------------------------------------
    // DATA SESSION
    // -------------------------------------------------

    const role = String(s.role || "")
        .trim()
        .toLowerCase();

    const file =
        window.location.pathname
            .split("/")
            .pop() || "dashboard.html";

    const isAdmin = role === "admin";


    // =================================================
    // MENU
    // =================================================

    const links = [

        [
            "dashboard.html",
            "🏠",
            "Dashboard"
        ],

        ...(isAdmin
            ? [
                [
                    "input-overtime.html",
                    "📝",
                    "Input Overtime"
                ],
                [
                    "users.html",
                    "👥",
                    "Akun"
                ]
            ]
            : []
        ),

        [
            "history.html",
            "📋",
            "History Overtime"
        ],

        [
            "edit-password.html",
            "🔑",
            "Edit Password"
        ],

        ...(isAdmin
            ? [
                [
                    "summary-overtime.html",
                    "📊",
                    "Summary Overtime"
                ]
            ]
            : [
                [
                    "akumulasi.html",
                    "📊",
                    "Akumulasi Overtime"
                ]
            ]
        )

    ];


    // =================================================
    // CONTAINER NAV
    // =================================================

    const navContainer =
        document.getElementById("nav");


    if (!navContainer) {

        console.error(
            "Element #nav tidak ditemukan."
        );

        return s;

    }


    // =================================================
    // HINDARI DOUBLE NAV
    // =================================================

    navContainer.innerHTML = "";


    // =================================================
    // BUAT SIDEBAR
    // =================================================

    const nav =
        document.createElement("nav");

    nav.className = "topbar";


    // =================================================
    // BRAND
    // =================================================

    const brand =
        document.createElement("div");

    brand.className = "brand";

    brand.innerHTML = `
        <span class="brand-icon">⏰</span>
        <span>Overtime System</span>
    `;

    nav.appendChild(brand);


    // =================================================
    // MENU
    // =================================================

    links.forEach(
        ([href, icon, label]) => {

            const a =
                document.createElement("a");

            a.href = href;

            a.className =
                file === href
                    ? "active"
                    : "";

            a.innerHTML = `
                <span class="nav-icon">
                    ${icon}
                </span>

                <span class="nav-label">
                    ${esc(label)}
                </span>
            `;

            nav.appendChild(a);

        }
    );


    // =================================================
    // LOGOUT
    // =================================================

    const logoutBtn =
        document.createElement("button");

    logoutBtn.type = "button";

    logoutBtn.id = "logout";

    logoutBtn.innerHTML = `
        <span class="nav-icon">
            🚪
        </span>

        <span>
            Logout
        </span>
    `;


    logoutBtn.addEventListener(
        "click",
        () => {

            if (
                confirm(
                    "Apakah Anda yakin ingin logout?"
                )
            ) {

                logout();

            }

        }
    );


    nav.appendChild(logoutBtn);


    // =================================================
    // MASUKKAN SIDEBAR
    // =================================================

    navContainer.appendChild(nav);


    // =================================================
    // IDENTITAS USER
    //
    // DIBUAT DI LUAR SIDEBAR
    // AGAR BISA BERADA DI KANAN ATAS
    // =================================================

    const userInfo =
        document.createElement("div");

    userInfo.className =
        "user-info";


    userInfo.innerHTML = `
        <span class="user-name">
            👤 ${esc(s.name || "User")}
        </span>

        <span class="user-sap">
            SAP ID:
            <strong>
                ${esc(s.sapId || "-")}
            </strong>
        </span>

        <span class="user-role">
            Role:
            <strong>
                ${esc(s.role || "-")}
            </strong>
        </span>
    `;


    // =================================================
    // MASUKKAN IDENTITAS KE CONTAINER NAV
    // TAPI DI LUAR .topbar
    // =================================================

    navContainer.appendChild(userInfo);


    // =================================================
    // RETURN SESSION
    // =================================================

    return s;

}
