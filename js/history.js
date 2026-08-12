// =====================================================
// HISTORY OVERTIME
// =====================================================

import { db } from "./firebase.js";

import {
    ref,
    onValue,
    get
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-database.js";

import {
    requireLogin
} from "./nav.js";

import {
    esc
} from "./session.js";

// =====================================================
// SESSION
// =====================================================

const s = requireLogin();

if (!s) {
    window.location.href = "index.html";
}

// =====================================================
// ELEMENT HTML
// =====================================================

const fromInput =
    document.getElementById("from");

const toInput =
    document.getElementById("to");

const filterBtn =
    document.getElementById("filterBtn");

const resetFilter =
    document.getElementById("resetFilter");

const excelBtn =
    document.getElementById("excelBtn");

const pdfBtn =
    document.getElementById("pdfBtn");

const summary =
    document.getElementById("summary");

const historyTable =
    document.getElementById("historyTable");

const tableBody =
    historyTable
        ? historyTable.querySelector("tbody")
        : null;

// =====================================================
// DATA
// =====================================================

let all = [];
let users = {};

// =====================================================
// LOAD USERS
// =====================================================

async function loadUsers() {

    try {

        const snapshot =
            await get(
                ref(db, "users")
            );

        if (snapshot.exists()) {

            users =
                snapshot.val();

        } else {

            users = {};

        }

    } catch (error) {

        console.error(
            "Gagal mengambil users:",
            error
        );

        users = {};

    }

}

// =====================================================
// LOAD OVERTIME
// =====================================================

function loadOvertime() {

    onValue(
        ref(db, "overtime"),
        (snapshot) => {

            if (snapshot.exists()) {

                const data =
                    snapshot.val();

                all =
                    Object.entries(data)
                        .map(
                            ([id, value]) => ({
                                id,
                                ...(value || {})
                            })
                        );

            } else {

                all = [];

            }

            apply();

        },
        (error) => {

            console.error(
                "Gagal mengambil data overtime:",
                error
            );

            all = [];

            apply();

        }
    );

}

// =====================================================
// FILTER DATA
// =====================================================

function getFiltered() {

    const fromDate =
        fromInput
            ? fromInput.value
            : "";

    const toDate =
        toInput
            ? toInput.value
            : "";

    return all
        .filter((x) => {

            // =================================================
            // ADMIN
            // Admin dapat melihat semua data
            // =================================================

            if (
                String(s.role).toLowerCase() ===
                "admin"
            ) {

                return true;

            }

            // =================================================
            // USER / OPERATOR
            // Hanya data miliknya sendiri
            // =================================================

            return (
                String(x.userSap || "").trim() ===
                String(s.sapId || "").trim()
            );

        })
        .filter((x) => {

            // FILTER DARI TANGGAL

            if (
                fromDate &&
                String(x.date || "") < fromDate
            ) {

                return false;

            }

            // FILTER SAMPAI TANGGAL

            if (
                toDate &&
                String(x.date || "") > toDate
            ) {

                return false;

            }

            return true;

        })
        .sort(
            (a, b) =>
                String(b.date || "")
                    .localeCompare(
                        String(a.date || "")
                    )
        );

}

// =====================================================
// TAMPILKAN DATA
// =====================================================

function apply() {

    if (!tableBody) {

        console.error(
            "Elemen #historyTable tbody tidak ditemukan."
        );

        return;

    }

    const data =
        getFiltered();

    // =================================================
    // JIKA TIDAK ADA DATA
    // =================================================

    if (data.length === 0) {

        tableBody.innerHTML = `
            <tr>
                <td
                    colspan="8"
                    class="empty"
                >
                    Tidak ada data sesuai filter.
                </td>
            </tr>
        `;

    } else {

        tableBody.innerHTML =
            data
                .map(
                    (x, i) => {

                        const hours =
                            Number(
                                x.hours || 0
                            );

                        const name =
                            users[
                                x.userSap
                            ]?.name || "";

                        return `
                            <tr>

                                <td>
                                    ${i + 1}
                                </td>

                                <td>
                                    ${esc(
                                        x.date || ""
                                    )}
                                </td>

                                <td>
                                    ${esc(
                                        x.userSap || ""
                                    )}
                                </td>

                                <td>
                                    ${esc(
                                        name
                                    )}
                                </td>

                                <td>
                                    ${esc(
                                        x.start || ""
                                    )}
                                </td>

                                <td>
                                    ${esc(
                                        x.end || ""
                                    )}
                                </td>

                                <td>
                                    ${hours}
                                </td>

                                <td>
                                    ${esc(
                                        x.note || ""
                                    )}
                                </td>

                            </tr>
                        `;

                    }
                )
                .join("");

    }

    // =================================================
    // SUMMARY
    // =================================================

    const totalHours =
        data.reduce(
            (total, x) =>
                total +
                Number(
                    x.hours || 0
                ),
            0
        );

    if (summary) {

        summary.textContent =
            `${data.length} data · ${totalHours} jam`;

    }

}

// =====================================================
// FILTER BUTTON
// =====================================================

if (filterBtn) {

    filterBtn.addEventListener(
        "click",
        () => {

            apply();

        }
    );

}

// =====================================================
// RESET FILTER
// =====================================================

if (resetFilter) {

    resetFilter.addEventListener(
        "click",
        () => {

            if (fromInput) {

                fromInput.value = "";

            }

            if (toInput) {

                toInput.value = "";

            }

            apply();

        }
    );

}

// =====================================================
// EXPORT EXCEL
// =====================================================

if (excelBtn) {

    excelBtn.addEventListener(
        "click",
        () => {

            const data =
                getFiltered();

            if (
                typeof XLSX ===
                "undefined"
            ) {

                alert(
                    "Library Excel belum dimuat."
                );

                return;

            }

            if (data.length === 0) {

                alert(
                    "Tidak ada data untuk diekspor."
                );

                return;

            }

            const exportData =
                data.map(
                    (x, i) => ({

                        No:
                            i + 1,

                        Tanggal:
                            x.date || "",

                        SAP:
                            x.userSap || "",

                        Nama:
                            users[
                                x.userSap
                            ]?.name || "",

                        Mulai:
                            x.start || "",

                        Selesai:
                            x.end || "",

                        Jam:
                            Number(
                                x.hours || 0
                            ),

                        Keterangan:
                            x.note || ""

                    })
                );

            const ws =
                XLSX.utils.json_to_sheet(
                    exportData
                );

            const wb =
                XLSX.utils.book_new();

            XLSX.utils.book_append_sheet(
                wb,
                ws,
                "History"
            );

            XLSX.writeFile(
                wb,
                "history-overtime.xlsx"
            );

        }
    );

}

// =====================================================
// EXPORT PDF
// =====================================================

if (pdfBtn) {

    pdfBtn.addEventListener(
        "click",
        () => {

            const data =
                getFiltered();

            if (data.length === 0) {

                alert(
                    "Tidak ada data untuk diekspor."
                );

                return;

            }

            if (
                typeof window.jspdf ===
                "undefined"
            ) {

                alert(
                    "Library PDF belum dimuat."
                );

                return;

            }

            const {
                jsPDF
            } = window.jspdf;

            const doc =
                new jsPDF(
                    "landscape"
                );

            doc.text(
                "History Overtime",
                14,
                14
            );

            const body =
                data.map(
                    (x, i) => [

                        i + 1,

                        x.date || "",

                        x.userSap || "",

                        users[
                            x.userSap
                        ]?.name || "",

                        x.start || "",

                        x.end || "",

                        x.hours || 0,

                        x.note || ""

                    ]
                );

            if (
                typeof doc.autoTable ===
                "function"
            ) {

                doc.autoTable({

                    head: [
                        [
                            "No",
                            "Tanggal",
                            "SAP",
                            "Nama",
                            "Mulai",
                            "Selesai",
                            "Jam",
                            "Keterangan"
                        ]
                    ],

                    body: body,

                    startY: 20,

                    styles: {
                        fontSize: 8
                    },

                    headStyles: {
                        fontSize: 8
                    }

                });

            } else {

                alert(
                    "Plugin AutoTable belum dimuat."
                );

                return;

            }

            doc.save(
                "history-overtime.pdf"
            );

        }
    );

}

// =====================================================
// INIT
// =====================================================

await loadUsers();

loadOvertime();