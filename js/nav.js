
// =====================================================
// NAV.JS
// NAVIGASI RESPONSIVE + ICON
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

        // -------------------------------------------------
        // DASHBOARD
        // -------------------------------------------------

        [
            "dashboard.html",
            "🏠",
            "Dashboard"
        ],


        // -------------------------------------------------
        // MENU ADMIN
        // -------------------------------------------------

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


        // -------------------------------------------------
        // HISTORY
        // -------------------------------------------------

        [
            "history.html",
            "📋",
            "History Overtime"
        ],


        // -------------------------------------------------
        // EDIT PASSWORD
        // -------------------------------------------------

        [
            "edit-password.html",
            "🔑",
            "Edit Password"
        ],


        // -------------------------------------------------
        // SUMMARY / AKUMULASI
        // -------------------------------------------------

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
    // NAVBAR
    // =================================================

    const nav =
        document.createElement("nav");

    nav.className = "topbar";


    // =================================================
    // HEADER
    // =================================================

    const header =
        document.createElement("div");

    header.className = "nav-header";


    // =================================================
    // BRAND
    // =================================================

    const brand =
        document.createElement("div");

    brand.className = "brand";

    brand.innerHTML = `
        <span class="brand-icon">⏰</span>

        <span class="brand-text">
            Overtime System
        </span>
    `;


    header.appendChild(brand);


    // =================================================
    // USER INFO
    // =================================================

    const userInfo =
        document.createElement("div");

    userInfo.className = "user-info";


    userInfo.innerHTML = `
        <div class="user-name">
            👤 ${esc(s.name || "User")}
        </div>

        <div class="user-detail">
            SAP ID: ${esc(s.sapId || "-")}
        </div>

        <div class="user-detail">
            Role: ${esc(s.role || "-")}
        </div>
    `;


    header.appendChild(userInfo);


    // =================================================
    // MASUKKAN HEADER
    // =================================================

    nav.appendChild(header);


    // =================================================
    // MENU WRAPPER
    // =================================================

    const menu =
        document.createElement("div");

    menu.className = "nav-menu";


    // =================================================
    // BUAT MENU
    // =================================================

    links.forEach(
        ([href, icon, label]) => {

            const a =
                document.createElement("a");

            a.href = href;


            // -------------------------------------------------
            // ACTIVE MENU
            // -------------------------------------------------

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


            menu.appendChild(a);

        }
    );


    // =================================================
    // MASUKKAN MENU
    // =================================================

    nav.appendChild(menu);


    // =================================================
    // LOGOUT
    // =================================================

    const logoutBtn =
        document.createElement("button");

    logoutBtn.type = "button";

    logoutBtn.id = "logout";

    logoutBtn.className = "logout-btn";


    logoutBtn.innerHTML = `
        <span class="nav-icon">
            🚪
        </span>

        <span class="nav-label">
            Logout
        </span>
    `;


    // =================================================
    // EVENT LOGOUT
    // =================================================

    logoutBtn.addEventListener(
        "click",
        () => {

            const yakin =
                confirm(
                    "Apakah Anda yakin ingin logout?"
                );


            if (yakin) {

                logout();

            }

        }
    );


    // =================================================
    // LOGOUT PALING BAWAH
    // =================================================

    nav.appendChild(logoutBtn);


    // =================================================
    // MASUKKAN NAV KE CONTAINER
    // =================================================

    navContainer.appendChild(nav);


    // =================================================
    // RETURN SESSION
    // =================================================

    return s;

}
