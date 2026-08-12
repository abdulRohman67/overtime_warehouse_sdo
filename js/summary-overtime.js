import { db } from "./firebase.js";

import {
    ref,
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

const session = requireLogin();

if (!session) {
    throw new Error("Session tidak ditemukan.");
}


if (
    String(session.role || "").toLowerCase() !==
    "admin"
) {

    window.location.href =
        "dashboard.html";

    throw new Error(
        "Summary Overtime hanya untuk admin."
    );

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

const resetBtn =
    document.getElementById("resetBtn");

const excelBtn =
    document.getElementById("excelBtn");

const pdfBtn =
    document.getElementById("pdfBtn");

const rows =
    document.getElementById("rows");

const userCount =
    document.getElementById("userCount");

const grandTotal =
    document.getElementById("grandTotal");

const tableGrandTotal =
    document.getElementById("tableGrandTotal");

const periodLabel =
    document.getElementById("periodLabel");


// =====================================================
// CEK ELEMENT
// =====================================================

console.log(
    "SUMMARY ELEMENT:",
    {
        fromInput,
        toInput,
        filterBtn,
        resetBtn,
        excelBtn,
        pdfBtn,
        rows,
        userCount,
        grandTotal,
        tableGrandTotal,
        periodLabel
    }
);


// =====================================================
// DATA
// =====================================================

let users = {};

let overtime = [];


// =====================================================
// DEFAULT TANGGAL
// =====================================================

function setDefaultPeriod() {

    if (fromInput) {
        fromInput.value =
            "2026-07-10";
    }

    if (toInput) {
        toInput.value =
            "2026-08-10";
    }

}

setDefaultPeriod();


// =====================================================
// LOAD DATA
// =====================================================

async function loadData() {

    try {

        /*
         * =============================================
         * BACA USERS
         * =============================================
         */

        console.log(
            "Membaca Firebase: users"
        );


        const usersSnapshot =
            await get(
                ref(
                    db,
                    "users"
                )
            );


        if (
            usersSnapshot.exists()
        ) {

            users =
                usersSnapshot.val();

        } else {

            users = {};

        }


        console.log(
            "USERS FIREBASE:",
            users
        );


        /*
         * =============================================
         * BACA OVERTIME
         * =============================================
         */

        console.log(
            "Membaca Firebase: overtime"
        );


        const overtimeSnapshot =
            await get(
                ref(
                    db,
                    "overtime"
                )
            );


        if (
            overtimeSnapshot.exists()
        ) {

            const data =
                overtimeSnapshot.val();


            overtime =
                Object.entries(
                    data
                ).map(
                    ([id, value]) => ({

                        id,

                        ...(value || {})

                    })
                );


        } else {

            overtime = [];

        }


        console.log(
            "OVERTIME FIREBASE:",
            overtime
        );


        console.log(
            "JUMLAH USER:",
            Object.keys(users).length
        );


        console.log(
            "JUMLAH OVERTIME:",
            overtime.length
        );


        render();


    } catch (error) {

        console.error(
            "ERROR SUMMARY OVERTIME:",
            error
        );


        if (rows) {

            rows.innerHTML = `

                <tr>

                    <td
                        colspan="4"
                        class="empty"
                        style="color:red"
                    >

                        GAGAL MEMBACA FIREBASE

                        <br><br>

                        ${esc(
                            error.message ||
                            "Unknown error"
                        )}

                    </td>

                </tr>

            `;

        }

    }

}


// =====================================================
// HITUNG SUMMARY
// =====================================================

function getSummary() {

    const from =
        fromInput
            ? fromInput.value
            : "";

    const to =
        toInput
            ? toInput.value
            : "";


    /*
     * =============================================
     * BUAT SEMUA USER
     * =============================================
     */

    const summary = {};


    Object.entries(
        users
    ).forEach(
        ([sapId, user]) => {

            /*
             * HANYA ROLE USER
             */

            if (
                String(
                    user?.role || ""
                ).toLowerCase() !==
                "user"
            ) {

                return;

            }


            summary[
                sapId
            ] = {

                sapId:
                    sapId,

                name:
                    String(
                        user?.name ||
                        sapId
                    ),

                hours:
                    0

            };

        }
    );


    /*
     * =============================================
     * HITUNG OVERTIME
     * =============================================
     */

    overtime.forEach(
        item => {

            const date =
                String(
                    item?.date || ""
                ).trim();


            const userSap =
                String(
                    item?.userSap || ""
                ).trim();


            const hours =
                Number(
                    item?.hours || 0
                );


            /*
             * TANGGAL
             */

            if (
                from &&
                date < from
            ) {

                return;

            }


            if (
                to &&
                date > to
            ) {

                return;

            }


            /*
             * USER HARUS ADA
             */

            if (
                !summary[
                    userSap
                ]
            ) {

                console.warn(
                    "SAP overtime tidak ditemukan:",
                    userSap
                );

                return;

            }


            /*
             * TAMBAH JAM
             */

            summary[
                userSap
            ].hours +=
                Number.isFinite(hours)
                    ? hours
                    : 0;

        }
    );


    /*
     * =============================================
     * SORT NAMA
     * =============================================
     */

    return Object.values(
        summary
    ).sort(
        (a, b) =>
            a.name.localeCompare(
                b.name
            )
    );

}


// =====================================================
// RENDER
// =====================================================

function render() {

    if (!rows) {

        console.error(
            "Element #rows tidak ditemukan."
        );

        return;

    }


    const data =
        getSummary();


    /*
     * =============================================
     * GRAND TOTAL
     * =============================================
     */

    const total =
        data.reduce(
            (sum, item) =>
                sum +
                Number(
                    item.hours || 0
                ),
            0
        );


    /*
     * =============================================
     * INFO
     * =============================================
     */

    if (userCount) {

        userCount.textContent =
            data.length;

    }


    if (grandTotal) {

        grandTotal.textContent =
            total;

    }


    if (tableGrandTotal) {

        tableGrandTotal.textContent =
            total;

    }


    if (periodLabel) {

        periodLabel.textContent =
            "Periode: " +
            formatDate(
                fromInput.value
            ) +
            " s/d " +
            formatDate(
                toInput.value
            );

    }


    /*
     * =============================================
     * TIDAK ADA USER
     * =============================================
     */

    if (!data.length) {

        rows.innerHTML = `

            <tr>

                <td
                    colspan="4"
                    class="empty"
                >

                    Tidak ada user.

                </td>

            </tr>

        `;

        return;

    }


    /*
     * =============================================
     * TABEL
     * =============================================
     */

    rows.innerHTML =
        data
            .map(
                (item, index) => `

                    <tr>

                        <td>
                            ${index + 1}
                        </td>

                        <td>
                            ${esc(
                                item.sapId
                            )}
                        </td>

                        <td>
                            ${esc(
                                item.name
                            )}
                        </td>

                        <td>
                            ${item.hours}
                        </td>

                    </tr>

                `
            )
            .join("");

}


// =====================================================
// FORMAT TANGGAL
// =====================================================

function formatDate(
    value
) {

    if (!value) {
        return "-";
    }


    const p =
        String(value).split("-");


    if (
        p.length !== 3
    ) {

        return value;

    }


    return (
        p[2] +
        "-" +
        p[1] +
        "-" +
        p[0]
    );

}


// =====================================================
// FILTER
// =====================================================

if (filterBtn) {

    filterBtn.addEventListener(
        "click",
        render
    );

}


// =====================================================
// RESET
// =====================================================

if (resetBtn) {

    resetBtn.addEventListener(
        "click",
        () => {

            setDefaultPeriod();

            render();

        }
    );

}


// =====================================================
// EXCEL
// =====================================================

if (excelBtn) {

    excelBtn.addEventListener(
        "click",
        () => {

            if (
                typeof XLSX ===
                "undefined"
            ) {

                alert(
                    "Library Excel belum dimuat."
                );

                return;

            }


            const data =
                getSummary();


            const exportData =
                data.map(
                    (item, index) => ({

                        No:
                            index + 1,

                        "SAP ID":
                            item.sapId,

                        "Nama User":
                            item.name,

                        "Jumlah Jam":
                            item.hours

                    })
                );


            const total =
                data.reduce(
                    (sum, item) =>
                        sum +
                        Number(
                            item.hours || 0
                        ),
                    0
                );


            exportData.push({

                No: "",

                "SAP ID": "",

                "Nama User":
                    "GRAND TOTAL",

                "Jumlah Jam":
                    total

            });


            const worksheet =
                XLSX.utils.json_to_sheet(
                    exportData
                );


            const workbook =
                XLSX.utils.book_new();


            XLSX.utils.book_append_sheet(
                workbook,
                worksheet,
                "Summary Overtime"
            );


            XLSX.writeFile(
                workbook,
                "summary-overtime-" +
                fromInput.value +
                "-sampai-" +
                toInput.value +
                ".xlsx"
            );

        }
    );

}


// =====================================================
// PDF
// =====================================================

if (pdfBtn) {

    pdfBtn.addEventListener(
        "click",
        () => {

            if (
                !window.jspdf ||
                !window.jspdf.jsPDF
            ) {

                alert(
                    "Library PDF belum dimuat."
                );

                return;

            }


            const data =
                getSummary();


            const {
                jsPDF
            } =
                window.jspdf;


            const doc =
                new jsPDF();


            const total =
                data.reduce(
                    (sum, item) =>
                        sum +
                        Number(
                            item.hours || 0
                        ),
                    0
                );


            doc.setFontSize(
                16
            );


            doc.text(
                "Summary Overtime",
                14,
                15
            );


            doc.setFontSize(
                10
            );


            doc.text(
                "Periode: " +
                formatDate(
                    fromInput.value
                ) +
                " s/d " +
                formatDate(
                    toInput.value
                ),
                14,
                22
            );


            if (
                typeof doc.autoTable !==
                "function"
            ) {

                alert(
                    "Plugin AutoTable belum dimuat."
                );

                return;

            }


            doc.autoTable({

                startY: 28,

                head: [

                    [
                        "No",
                        "SAP ID",
                        "Nama User",
                        "Jumlah Jam"
                    ]

                ],

                body:
                    data.map(
                        (item, index) => [

                            index + 1,

                            item.sapId,

                            item.name,

                            item.hours

                        ]
                    ),

                foot: [

                    [
                        "",
                        "",
                        "GRAND TOTAL",
                        total
                    ]

                ]

            });


            doc.save(
                "summary-overtime-" +
                fromInput.value +
                "-sampai-" +
                toInput.value +
                ".pdf"
            );

        }
    );

}


// =====================================================
// MULAI LOAD
// =====================================================

loadData();