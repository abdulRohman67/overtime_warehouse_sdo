// =====================================================
// AKUMULASI OVERTIME
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

    window.location.href = "index.html";

    throw new Error(
        "Session tidak ditemukan."
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

const rows =
    document.getElementById("rows");

const count =
    document.getElementById("count");

const hours =
    document.getElementById("hours");

const conversion =
    document.getElementById("conversion");

const info =
    document.getElementById("info");

const periodLabel =
    document.getElementById("periodLabel");

const tableTotalHours =
    document.getElementById("tableTotalHours");

const tableTotalConversion =
    document.getElementById(
        "tableTotalConversion"
    );

const downloadExcelBtn =
    document.getElementById(
        "downloadExcelBtn"
    );

const downloadPdfBtn =
    document.getElementById(
        "downloadPdfBtn"
    );


// =====================================================
// DATA
// =====================================================

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
// AMBIL KONVERSI DARI DATA FIREBASE
// =====================================================
//
// PENTING:
//
// Konversi TIDAK dihitung dari total jam.
//
// Contoh:
//
// Record 1:
// hours = 2
// conversionHours = 3.5
//
// Record 2:
// hours = 4
// conversionHours = 7.5
//
// Maka:
//
// total jam = 6
// total konversi = 11
//
// =====================================================

function getConversionHours(item) {

    if (
        item &&
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

    const value =
        Number(
            item?.hours || 0
        );


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


    return conversion[value] !== undefined

        ? conversion[value]

        : value;

}


// =====================================================
// FORMAT ANGKA
// =====================================================

function formatNumber(value) {

    const number =
        Number(value || 0);


    if (
        !Number.isFinite(number)
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


    const parts =
        String(value).split("-");


    if (
        parts.length !== 3
    ) {

        return value;

    }


    return (
        parts[2] +
        "-" +
        parts[1] +
        "-" +
        parts[0]
    );

}


// =====================================================
// FILTER DATA
// =====================================================

function getFilteredData() {

    const from =
        String(
            fromInput?.value || ""
        ).trim();


    const to =
        String(
            toInput?.value || ""
        ).trim();


    return overtime

        .filter(item => {

            const date =
                String(
                    item?.date || ""
                ).trim();


            if (
                from &&
                date < from
            ) {

                return false;

            }


            if (
                to &&
                date > to
            ) {

                return false;

            }


            // USER HANYA MELIHAT DATA SENDIRI
            // ADMIN MELIHAT SEMUA DATA

            if (
                String(
                    session.role || ""
                ).toLowerCase() ===
                "admin"
            ) {

                return true;

            }


            return (
                String(
                    item?.userSap || ""
                ).trim() ===

                String(
                    session.sapId || ""
                ).trim()
            );

        })

        .sort(
            (a, b) =>
                String(
                    b.date || ""
                ).localeCompare(
                    String(
                        a.date || ""
                    )
                )
        );

}


// =====================================================
// HITUNG TOTAL
// =====================================================
//
// TOTAL DILAKUKAN DARI RINCIAN.
//
// BUKAN:
//
// calculateConversion(totalHours)
//
// TETAPI:
//
// conversion record 1
// + conversion record 2
// + conversion record 3
//
// =====================================================

function calculateTotals(data) {

    let totalHours = 0;

    let totalConversion = 0;


    data.forEach(item => {

        totalHours +=
            Number(
                item?.hours || 0
            );


        totalConversion +=
            getConversionHours(
                item
            );

    });


    return {

        totalHours,

        totalConversion

    };

}


// =====================================================
// RENDER
// =====================================================

function render() {

    if (!rows) {

        return;

    }


    const data =
        getFilteredData();


    const totals =
        calculateTotals(
            data
        );


    // =================================================
    // CARD TOTAL DATA
    // =================================================

    if (count) {

        count.textContent =
            data.length;

    }


    // =================================================
    // CARD TOTAL JAM
    // =================================================

    if (hours) {

        hours.textContent =
            formatNumber(
                totals.totalHours
            );

    }


    // =================================================
    // CARD KONVERSI
    // =================================================

    if (conversion) {

        conversion.textContent =
            formatNumber(
                totals.totalConversion
            );

    }


    // =================================================
    // LABEL PERIODE
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
    // INFORMASI
    // =================================================

    if (info) {

        info.textContent =
            data.length +
            " data · " +
            formatNumber(
                totals.totalHours
            ) +
            " jam · " +
            formatNumber(
                totals.totalConversion
            ) +
            " jam konversi";

    }


    // =================================================
    // DATA KOSONG
    // =================================================

    if (data.length === 0) {

        rows.innerHTML = `

            <tr>

                <td
                    colspan="5"
                    class="empty"
                >

                    Tidak ada data overtime
                    pada periode yang dipilih.

                </td>

            </tr>

        `;

    } else {

        rows.innerHTML =

            data.map(

                (item, index) => {

                    const itemHours =
                        Number(
                            item?.hours || 0
                        );


                    const itemConversion =
                        getConversionHours(
                            item
                        );


                    return `

                        <tr>

                            <td>
                                ${index + 1}
                            </td>

                            <td>
                                ${esc(
                                    formatDate(
                                        item.date
                                    )
                                )}
                            </td>

                            <td>
                                ${formatNumber(
                                    itemHours
                                )}
                            </td>

                            <td>
                                ${formatNumber(
                                    itemConversion
                                )}
                            </td>

                            <td>
                                ${esc(
                                    item.note || ""
                                )}
                            </td>

                        </tr>

                    `;

                }

            ).join("");

    }


    // =================================================
    // FOOTER TOTAL JAM
    // =================================================

    if (tableTotalHours) {

        tableTotalHours.textContent =
            formatNumber(
                totals.totalHours
            );

    }


    // =================================================
    // FOOTER TOTAL KONVERSI
    // =================================================

    if (tableTotalConversion) {

        tableTotalConversion.textContent =
            formatNumber(
                totals.totalConversion
            );

    }

}


// =====================================================
// LOAD FIREBASE
// =====================================================

async function loadData() {

    try {

        const snapshot =
            await get(
                ref(
                    db,
                    "overtime"
                )
            );


        if (
            snapshot.exists()
        ) {

            const data =
                snapshot.val();


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


        render();

    } catch (error) {

        console.error(
            "Gagal mengambil overtime:",
            error
        );


        overtime = [];


        if (rows) {

            rows.innerHTML = `

                <tr>

                    <td
                        colspan="5"
                        class="empty"
                        style="color:red"
                    >

                        Gagal membaca data overtime.

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
// FILTER BUTTON
// =====================================================

if (filterBtn) {

    filterBtn.addEventListener(
        "click",
        () => {

            render();

        }
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
// DOWNLOAD EXCEL
// =====================================================

if (downloadExcelBtn) {

    downloadExcelBtn.addEventListener(
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
                getFilteredData();


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

                    (item, index) => ({

                        No:
                            index + 1,

                        Tanggal:
                            item.date || "",

                        Jam:
                            Number(
                                item.hours || 0
                            ),

                        "Konversi Lembur":
                            getConversionHours(
                                item
                            ),

                        Keterangan:
                            item.note || ""

                    })

                );


            const totals =
                calculateTotals(
                    data
                );


            exportData.push({

                No: "",

                Tanggal: "",

                Jam:
                    totals.totalHours,

                "Konversi Lembur":
                    totals.totalConversion,

                Keterangan:
                    "TOTAL"

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
                "Akumulasi Overtime"
            );


            XLSX.writeFile(
                workbook,
                "akumulasi-overtime-" +
                (
                    fromInput?.value || ""
                ) +
                "-sampai-" +
                (
                    toInput?.value || ""
                ) +
                ".xlsx"
            );

        }
    );

}


// =====================================================
// DOWNLOAD PDF
// =====================================================

if (downloadPdfBtn) {

    downloadPdfBtn.addEventListener(
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
                getFilteredData();


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
            } = window.jspdf;


            const doc =
                new jsPDF(
                    "landscape"
                );


            const totals =
                calculateTotals(
                    data
                );


            doc.setFontSize(16);

            doc.text(
                "Akumulasi Overtime",
                14,
                15
            );


            doc.setFontSize(10);

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

                startY: 28,

                head: [

                    [

                        "No",

                        "Tanggal",

                        "Jam",

                        "Konversi Lembur",

                        "Keterangan"

                    ]

                ],

                body:

                    data.map(

                        (item, index) => [

                            index + 1,

                            formatDate(
                                item.date
                            ),

                            formatNumber(
                                item.hours
                            ),

                            formatNumber(
                                getConversionHours(
                                    item
                                )
                            ),

                            item.note || ""

                        ]

                    ),

                foot: [

                    [

                        "",

                        "TOTAL",

                        formatNumber(
                            totals.totalHours
                        ),

                        formatNumber(
                            totals.totalConversion
                        ),

                        ""

                    ]

                ],

                styles: {

                    fontSize: 9

                }

            });


            doc.save(
                "akumulasi-overtime-" +
                (
                    fromInput?.value || ""
                ) +
                "-sampai-" +
                (
                    toInput?.value || ""
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
