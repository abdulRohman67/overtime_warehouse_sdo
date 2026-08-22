// =====================================================
// SUMMARY OVERTIME
// =====================================================

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

    throw new Error(
        "Session tidak ditemukan."
    );

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
// ELEMENT
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

// GRAND TOTAL KONVERSI DI CARD ATAS
const grandConversion =
    document.getElementById("grandConversion");

const tableGrandTotal =
    document.getElementById("tableGrandTotal");

const periodLabel =
    document.getElementById("periodLabel");


// =====================================================
// DATA
// =====================================================

let users = {};

let overtime = [];


// =====================================================
// DEFAULT PERIODE
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
// KONVERSI DATA LAMA
// =====================================================
//
// Hanya digunakan untuk data lama yang belum
// mempunyai conversionHours.
//
// Data baru mengambil conversionHours langsung
// dari Firebase.
// =====================================================

function calculateConversionHours(value) {

    const total =
        Number(value) || 0;


    const conversion = {

        1: 1.5,

        2: 3.5,

        3: 5.5,

        3.5: 6.5,

        4: 7.5,

        5: 9.5,

        6: 11.5,

        7: 14,

        8: 17,

        3.5: 6.5,

        1.5 : 2.5

    };


    return conversion[total] !== undefined

        ? conversion[total]

        : total;

}


// =====================================================
// AMBIL KONVERSI DARI RINCIAN
// =====================================================

function getConversionHours(item) {

    if (!item) {

        return 0;

    }


    // =================================================
    // DATA BARU
    // =================================================
    //
    // Ambil conversionHours langsung dari Firebase.
    //
    // =================================================

    if (
        item.conversionHours !== undefined &&
        item.conversionHours !== null &&
        item.conversionHours !== ""
    ) {

        const value =
            Number(
                item.conversionHours
            );


        if (
            Number.isFinite(value)
        ) {

            return value;

        }

    }


    // =================================================
    // DATA LAMA
    // =================================================

    return calculateConversionHours(
        item.hours || 0
    );

}


// =====================================================
// LOAD DATA
// =====================================================

async function loadData() {

    try {

        // =================================================
        // USERS
        // =================================================

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


        // =================================================
        // OVERTIME
        // =================================================

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
            "USERS:",
            users
        );


        console.log(
            "OVERTIME:",
            overtime
        );


        render();

    } catch (error) {

        console.error(
            "ERROR SUMMARY:",
            error
        );


        if (rows) {

            rows.innerHTML = `

                <tr>

                    <td
                        colspan="5"
                        class="empty"
                        style="color:red"
                    >

                        Gagal membaca data.

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
// GET SUMMARY
// =====================================================
//
// SETIAP DATA OVERTIME DIJUMLAHKAN.
//
// JAM:
//
// item 1 hours
// + item 2 hours
// + item 3 hours
//
// KONVERSI:
//
// item 1 conversionHours
// + item 2 conversionHours
// + item 3 conversionHours
//
// TIDAK ADA KONVERSI ULANG DARI TOTAL JAM.
// =====================================================

function getSummary() {

    const from =
        String(
            fromInput?.value || ""
        ).trim();


    const to =
        String(
            toInput?.value || ""
        ).trim();


    const summary = {};


    // =================================================
    // BUAT SEMUA USER
    // =================================================

    Object.entries(
        users
    ).forEach(
        ([sapId, user]) => {

            if (
                String(
                    user?.role || ""
                ).toLowerCase() !==
                "user"
            ) {

                return;

            }


            const key =
                String(
                    sapId
                ).trim();


            summary[key] = {

                sapId:
                    key,

                name:
                    String(
                        user?.name ||
                        key
                    ),

                hours:
                    0,

                conversion:
                    0,

                count:
                    0

            };

        }
    );


    // =================================================
    // AKUMULASI DATA OVERTIME
    // =================================================

    overtime.forEach(
        item => {

            const date =
                String(
                    item?.date || ""
                ).trim();


            const sap =
                String(
                    item?.userSap || ""
                ).trim();


            // =========================================
            // FILTER DARI
            // =========================================

            if (
                from &&
                date < from
            ) {

                return;

            }


            // =========================================
            // FILTER SAMPAI
            // =========================================

            if (
                to &&
                date > to
            ) {

                return;

            }


            // =========================================
            // USER TIDAK TERDAFTAR
            // =========================================

            if (
                !summary[sap]
            ) {

                return;

            }


            // =========================================
            // JAM DARI RINCIAN
            // =========================================

            const hours =
                Number(
                    item?.hours || 0
                );


            // =========================================
            // KONVERSI DARI RINCIAN
            // =========================================

            const conversion =
                getConversionHours(
                    item
                );


            // =========================================
            // TAMBAH JAM
            // =========================================

            if (
                Number.isFinite(hours)
            ) {

                summary[sap].hours +=
                    hours;

            }


            // =========================================
            // TAMBAH KONVERSI
            // =========================================

            if (
                Number.isFinite(conversion)
            ) {

                summary[sap].conversion +=
                    conversion;

            }


            // =========================================
            // JUMLAH DATA
            // =========================================

            summary[sap].count +=
                1;

        }
    );


    // =================================================
    // SORT BERDASARKAN NAMA
    // =================================================

    return Object.values(
        summary
    ).sort(
        (a, b) =>
            String(
                a.name
            ).localeCompare(
                String(
                    b.name
                )
            )
    );

}


// =====================================================
// FORMAT ANGKA
// =====================================================

function formatNumber(value) {

    const number =
        Number(
            value || 0
        );


    if (
        !Number.isFinite(
            number
        )
    ) {

        return "0";

    }


    return Number(
        number.toFixed(2)
    ).toString();

}


// =====================================================
// FORMAT TANGGAL
// =====================================================

function formatDate(value) {

    if (!value) {

        return "-";

    }


    const p =
        String(
            value
        ).split("-");


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
// RENDER
// =====================================================

function render() {

    if (!rows) {

        return;

    }


    const data =
        getSummary();


    // =================================================
    // GRAND TOTAL JAM
    // =================================================

    const totalHours =
        data.reduce(
            (
                total,
                item
            ) => {

                return (
                    total +
                    Number(
                        item.hours || 0
                    )
                );

            },
            0
        );


    // =================================================
    // GRAND TOTAL KONVERSI
    // =================================================

    const totalConversion =
        data.reduce(
            (
                total,
                item
            ) => {

                return (
                    total +
                    Number(
                        item.conversion || 0
                    )
                );

            },
            0
        );


    // =================================================
    // JUMLAH USER
    // =================================================

    if (userCount) {

        userCount.textContent =
            data.length;

    }


    // =================================================
    // GRAND TOTAL JAM CARD
    // =================================================

    if (grandTotal) {

        grandTotal.textContent =
            formatNumber(
                totalHours
            );

    }


    // =================================================
    // GRAND TOTAL KONVERSI CARD
    // =================================================

    if (grandConversion) {

        grandConversion.textContent =
            formatNumber(
                totalConversion
            );

    }


    // =================================================
    // PERIOD LABEL
    // =================================================

    if (periodLabel) {

        periodLabel.textContent =
            "Periode: " +
            formatDate(
                fromInput?.value
            ) +
            " s/d " +
            formatDate(
                toInput?.value
            );

    }


    // =================================================
    // DATA KOSONG
    // =================================================

    if (
        data.length === 0
    ) {

        rows.innerHTML = `

            <tr>

                <td
                    colspan="5"
                    class="empty"
                >

                    Tidak ada user.

                </td>

            </tr>

        `;

    } else {

        // =============================================
        // TABEL
        // =============================================

        rows.innerHTML =
            data
                .map(
                    (
                        item,
                        index
                    ) => `

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
                                ${formatNumber(
                                    item.hours
                                )}
                            </td>

                            <td>
                                ${formatNumber(
                                    item.conversion
                                )}
                            </td>

                        </tr>

                    `
                )
                .join("");

    }


    // =================================================
    // FOOTER GRAND TOTAL JAM
    // =================================================

    if (tableGrandTotal) {

        tableGrandTotal.textContent =
            formatNumber(
                totalHours
            );

    }


    // =================================================
    // FOOTER GRAND TOTAL KONVERSI
    // =================================================

    const conversionFooter =
        document.getElementById(
            "tableGrandConversion"
        );


    if (conversionFooter) {

        conversionFooter.textContent =
            formatNumber(
                totalConversion
            );

    }

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


            if (
                data.length === 0
            ) {

                alert(
                    "Tidak ada data untuk diekspor."
                );

                return;

            }


            const exportData =
                data.map(
                    (
                        item,
                        index
                    ) => ({

                        No:
                            index + 1,

                        "SAP ID":
                            item.sapId,

                        "Nama User":
                            item.name,

                        "Jumlah Jam":
                            formatNumber(
                                item.hours
                            ),

                        "Konversi Lembur":
                            formatNumber(
                                item.conversion
                            )

                    })
                );


            // =========================================
            // GRAND TOTAL
            // =========================================

            const totalHours =
                data.reduce(
                    (
                        total,
                        item
                    ) =>
                        total +
                        Number(
                            item.hours || 0
                        ),
                    0
                );


            const totalConversion =
                data.reduce(
                    (
                        total,
                        item
                    ) =>
                        total +
                        Number(
                            item.conversion || 0
                        ),
                    0
                );


            exportData.push({

                No:
                    "",

                "SAP ID":
                    "",

                "Nama User":
                    "GRAND TOTAL",

                "Jumlah Jam":
                    formatNumber(
                        totalHours
                    ),

                "Konversi Lembur":
                    formatNumber(
                        totalConversion
                    )

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
                (
                    fromInput?.value ||
                    ""
                ) +
                "-sampai-" +
                (
                    toInput?.value ||
                    ""
                ) +
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


            if (
                data.length === 0
            ) {

                alert(
                    "Tidak ada data untuk diekspor."
                );

                return;

            }


            const {
                jsPDF
            } =
                window.jspdf;


            const doc =
                new jsPDF();


            const totalHours =
                data.reduce(
                    (
                        total,
                        item
                    ) =>
                        total +
                        Number(
                            item.hours || 0
                        ),
                    0
                );


            const totalConversion =
                data.reduce(
                    (
                        total,
                        item
                    ) =>
                        total +
                        Number(
                            item.conversion || 0
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
                    fromInput?.value
                ) +
                " s/d " +
                formatDate(
                    toInput?.value
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

                startY:
                    28,

                head: [

                    [

                        "No",

                        "SAP ID",

                        "Nama User",

                        "Jumlah Jam",

                        "Konversi Lembur"

                    ]

                ],

                body:
                    data.map(
                        (
                            item,
                            index
                        ) => [

                            index + 1,

                            item.sapId,

                            item.name,

                            formatNumber(
                                item.hours
                            ),

                            formatNumber(
                                item.conversion
                            )

                        ]
                    ),

                foot: [

                    [

                        "",

                        "",

                        "GRAND TOTAL",

                        formatNumber(
                            totalHours
                        ),

                        formatNumber(
                            totalConversion
                        )

                    ]

                ]

            });


            doc.save(
                "summary-overtime-" +
                (
                    fromInput?.value ||
                    ""
                ) +
                "-sampai-" +
                (
                    toInput?.value ||
                    ""
                ) +
                ".pdf"
            );

        }
    );

}


// =====================================================
// INIT
// =====================================================

loadData();
