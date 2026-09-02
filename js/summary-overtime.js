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

const grandConversion =
    document.getElementById("grandConversion");

const tableGrandTotal =
    document.getElementById("tableGrandTotal");

const periodLabel =
    document.getElementById("periodLabel");


// =====================================================
// CANVAS GRAFIK
// =====================================================

const overtimeChartCanvas =
    document.getElementById(
        "overtimeChart"
    );


// GRAFIK LINGKARAN KETERANGAN
const overtimeNoteChartCanvas =
    document.getElementById(
        "overtimeNoteChart"
    );


// =====================================================
// DATA
// =====================================================

let users = {};

let overtime = [];

let overtimeChart = null;

let overtimeNoteChart = null;


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

function calculateConversionHours(value) {

    const total =
        Number(value) || 0;


    const conversion = {

        1: 1.5,

        1.5: 2.5,

        2: 3.5,

        3: 5.5,

        3.5: 6.5,

        4: 7.5,

        5: 9.5,

        6: 11.5,

        7: 14,

        8: 17

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
// NORMALISASI TANGGAL
// =====================================================

function normalizeDate(value) {

    if (!value) {

        return "";

    }


    const text =
        String(
            value
        ).trim();


    // =================================================
    // YYYY-MM-DD
    // =================================================

    if (
        /^\d{4}-\d{2}-\d{2}$/.test(
            text
        )
    ) {

        return text;

    }


    // =================================================
    // YYYY-MM-DD HH:mm:ss
    // =================================================

    if (
        /^\d{4}-\d{2}-\d{2}/.test(
            text
        )
    ) {

        return text.substring(
            0,
            10
        );

    }


    // =================================================
    // DD-MM-YYYY
    // =================================================

    let match =
        text.match(
            /^(\d{2})-(\d{2})-(\d{4})$/
        );


    if (match) {

        return (

            match[3] +
            "-" +
            match[2] +
            "-" +
            match[1]

        );

    }


    // =================================================
    // DD/MM/YYYY
    // =================================================

    match =
        text.match(
            /^(\d{2})\/(\d{2})\/(\d{4})$/
        );


    if (match) {

        return (

            match[3] +
            "-" +
            match[2] +
            "-" +
            match[1]

        );

    }


    // =================================================
    // FORMAT DATE LAIN
    // =================================================

    const parsed =
        new Date(
            text
        );


    if (
        !Number.isNaN(
            parsed.getTime()
        )
    ) {

        const year =
            parsed.getFullYear();


        const month =
            String(
                parsed.getMonth() + 1
            ).padStart(
                2,
                "0"
            );


        const day =
            String(
                parsed.getDate()
            ).padStart(
                2,
                "0"
            );


        return (

            year +
            "-" +
            month +
            "-" +
            day

        );

    }


    return "";

}


// =====================================================
// DATA YANG SUDAH DIFILTER
// =====================================================
//
// Fungsi ini penting karena grafik batang dan
// grafik lingkaran HARUS menggunakan filter yang sama.
//

function getFilteredOvertime() {

    const from =
        normalizeDate(
            fromInput?.value || ""
        );


    const to =
        normalizeDate(
            toInput?.value || ""
        );


    return overtime.filter(
        item => {

            const date =
                normalizeDate(
                    item?.date
                );


            if (!date) {

                return false;

            }


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


            return true;

        }
    );

}


// =====================================================
// GET SUMMARY PER USER
// =====================================================

function getSummary() {

    const filteredOvertime =
        getFilteredOvertime();


    const summary = {};


    // =================================================
    // SEMUA USER
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
    // AKUMULASI
    // =================================================

    filteredOvertime.forEach(
        item => {

            const sap =
                String(
                    item?.userSap || ""
                ).trim();


            if (
                !summary[sap]
            ) {

                return;

            }


            const hours =
                Number(
                    item?.hours || 0
                );


            const conversion =
                getConversionHours(
                    item
                );


            if (
                Number.isFinite(
                    hours
                )
            ) {

                summary[sap].hours +=
                    hours;

            }


            if (
                Number.isFinite(
                    conversion
                )
            ) {

                summary[sap].conversion +=
                    conversion;

            }


            summary[sap].count +=
                1;

        }
    );


    // =================================================
    // SORT NAMA
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
// GET SUMMARY BERDASARKAN KETERANGAN
// =====================================================
//
// INI UNTUK GRAFIK LINGKARAN.
//
// Yang digunakan:
// item.note
//
// BUKAN:
// nama user
//
// Contoh:
// note = "Lembur Produksi"
// note = "Meeting"
// note = "Support"
//
// Akan menjadi:
//
// Lembur Produksi -> jumlah data
// Meeting         -> jumlah data
// Support         -> jumlah data
//
// Kemudian dihitung persentasenya.
//

function getNoteSummary() {

    const filteredOvertime =
        getFilteredOvertime();


    const noteMap = {};


    filteredOvertime.forEach(
        item => {

            let note =
                String(
                    item?.note || ""
                ).trim();


            // =================================================
            // JIKA KETERANGAN KOSONG
            // =================================================

            if (!note) {

                note =
                    "Tanpa Keterangan";

            }


            if (
                !noteMap[note]
            ) {

                noteMap[note] = 0;

            }


            noteMap[note] += 1;

        }
    );


    const total =
        Object.values(
            noteMap
        ).reduce(
            (
                sum,
                value
            ) =>
                sum +
                Number(value || 0),
            0
        );


    return Object.entries(
        noteMap
    )
        .map(
            ([note, count]) => ({

                note:

                    note,

                count:

                    Number(
                        count
                    ),

                percentage:

                    total > 0

                        ? (
                            Number(count) /
                            total
                        ) *
                        100

                        : 0

            })
        )
        .sort(
            (a, b) =>
                b.count -
                a.count
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
// FORMAT PERSENTASE
// =====================================================

function formatPercentage(value) {

    const number =
        Number(
            value || 0
        );


    if (
        !Number.isFinite(
            number
        )
    ) {

        return "0%";

    }


    return (
        Number(
            number.toFixed(2)
        ) +
        "%"
    );

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
// GRAFIK BATANG
// =====================================================

function renderChart(data) {

    if (
        !overtimeChartCanvas
    ) {

        console.warn(
            "Canvas #overtimeChart tidak ditemukan."
        );

        return;

    }


    if (
        typeof Chart ===
        "undefined"
    ) {

        console.error(
            "Chart.js belum dimuat."
        );

        return;

    }


    if (
        typeof ChartDataLabels ===
        "undefined"
    ) {

        console.error(
            "ChartDataLabels belum dimuat."
        );

        return;

    }


    // =================================================
    // HAPUS GRAFIK LAMA
    // =================================================

    if (
        overtimeChart
    ) {

        overtimeChart.destroy();

        overtimeChart =
            null;

    }


    const labels =
        data.map(
            item =>
                String(
                    item.name
                )
        );


    const values =
        data.map(
            item =>
                Number(
                    item.hours || 0
                )
        );


    overtimeChart =
        new Chart(
            overtimeChartCanvas,
            {

                type:
                    "bar",

                plugins: [

                    ChartDataLabels

                ],

                data: {

                    labels:
                        labels,

                    datasets: [

                        {

                            label:
                                "Jumlah Jam Overtime",

                            data:
                                values,

                            backgroundColor:
                                "rgba(54, 162, 235, 0.75)",

                            borderColor:
                                "rgba(54, 162, 235, 1)",

                            borderWidth:
                                1,

                            borderRadius:
                                5,

                            maxBarThickness:
                                55

                        }

                    ]

                },


                options: {

                    responsive:
                        true,

                    maintainAspectRatio:
                        false,

                    animation:
                        false,


                    layout: {

                        padding: {

                            top:
                                35

                        }

                    },


                    plugins: {

                        legend: {

                            display:
                                true

                        },


                        title: {

                            display:
                                true,

                            text:
                                "Jumlah Jam Overtime Berdasarkan Nama User"

                        },


                        datalabels: {

                            display:
                                true,

                            anchor:
                                "end",

                            align:
                                "top",

                            offset:
                                4,

                            clamp:
                                true,

                            clip:
                                false,

                            color:
                                "#000000",

                            font: {

                                weight:
                                    "bold",

                                size:
                                    12

                            },

                            formatter:
                                function(value) {

                                    return formatNumber(
                                        value
                                    );

                                }

                        }

                    },


                    scales: {

                        x: {

                            title: {

                                display:
                                    true,

                                text:
                                    "Nama User"

                            },

                            ticks: {

                                autoSkip:
                                    false,

                                maxRotation:
                                    45,

                                minRotation:
                                    0

                            }

                        },


                        y: {

                            beginAtZero:
                                true,

                            title: {

                                display:
                                    true,

                                text:
                                    "Jumlah Jam"

                            },

                            ticks: {

                                precision:
                                    2

                            }

                        }

                    }

                }

            }
        );

}


// =====================================================
// GRAFIK LINGKARAN BERDASARKAN KETERANGAN
// =====================================================

function renderNoteChart() {

    if (
        !overtimeNoteChartCanvas
    ) {

        console.warn(
            "Canvas #overtimeNoteChart tidak ditemukan."
        );

        return;

    }


    if (
        typeof Chart ===
        "undefined"
    ) {

        console.error(
            "Chart.js belum dimuat."
        );

        return;

    }


    if (
        typeof ChartDataLabels ===
        "undefined"
    ) {

        console.error(
            "ChartDataLabels belum dimuat."
        );

        return;

    }


    // =================================================
    // HAPUS GRAFIK LAMA
    // =================================================

    if (
        overtimeNoteChart
    ) {

        overtimeNoteChart.destroy();

        overtimeNoteChart =
            null;

    }


    // =================================================
    // AMBIL DATA KETERANGAN
    // =================================================

    const noteData =
        getNoteSummary();


    console.log(
        "SUMMARY KETERANGAN:",
        noteData
    );


    const labels =
        noteData.map(
            item =>
                item.note
        );


    const values =
        noteData.map(
            item =>
                item.count
        );


    // =================================================
    // WARNA
    // =================================================

    const colors = [

        "#36A2EB",

        "#FF6384",

        "#FFCE56",

        "#4BC0C0",

        "#9966FF",

        "#FF9F40",

        "#8BC34A",

        "#E91E63",

        "#795548",

        "#607D8B",

        "#00BCD4",

        "#673AB7",

        "#CDDC39",

        "#F44336",

        "#009688"

    ];


    // =================================================
    // JIKA TIDAK ADA DATA
    // =================================================

    if (
        noteData.length === 0
    ) {

        overtimeNoteChart =
            new Chart(
                overtimeNoteChartCanvas,
                {

                    type:
                        "doughnut",

                    data: {

                        labels: [

                            "Tidak ada data"

                        ],

                        datasets: [

                            {

                                data: [

                                    1

                                ],

                                backgroundColor: [

                                    "#E0E0E0"

                                ],

                                borderColor: [

                                    "#FFFFFF"

                                ],

                                borderWidth:
                                    2

                            }

                        ]

                    },

                    options: {

                        responsive:
                            true,

                        maintainAspectRatio:
                            false,

                        plugins: {

                            legend: {

                                display:
                                    true,

                                position:
                                    "right"

                            },

                            title: {

                                display:
                                    true,

                                text:
                                    "Persentase Keterangan Overtime"

                            }

                        }

                    }

                }
            );


        return;

    }


    // =================================================
    // BUAT GRAFIK
    // =================================================

    overtimeNoteChart =
        new Chart(
            overtimeNoteChartCanvas,
            {

                type:
                    "doughnut",


                plugins: [

                    ChartDataLabels

                ],


                data: {

                    labels:
                        labels,

                    datasets: [

                        {

                            label:
                                "Keterangan Overtime",

                            data:
                                values,

                            backgroundColor:
                                labels.map(
                                    (
                                        label,
                                        index
                                    ) =>
                                        colors[
                                            index %
                                            colors.length
                                        ]
                                ),

                            borderColor:
                                "#FFFFFF",

                            borderWidth:
                                2

                        }

                    ]

                },


                options: {

                    responsive:
                        true,

                    maintainAspectRatio:
                        false,

                    animation:
                        false,


                    plugins: {

                        legend: {

                            display:
                                true,

                            position:
                                "right",

                            labels: {

                                padding:
                                    15,

                                usePointStyle:
                                    true

                            }

                        },


                        title: {

                            display:
                                true,

                            text:
                                "Persentase Keterangan Overtime"

                        },


                        tooltip: {

                            callbacks: {

                                label:
                                    function(context) {

                                        const index =
                                            context.dataIndex;


                                        const item =
                                            noteData[
                                                index
                                            ];


                                        return (

                                            " " +
                                            item.note +
                                            ": " +
                                            item.count +
                                            " data (" +
                                            formatPercentage(
                                                item.percentage
                                            ) +
                                            ")"

                                        );

                                    }

                            }

                        },


                        datalabels: {

                            color:
                                "#FFFFFF",

                            font: {

                                weight:
                                    "bold",

                                size:
                                    13

                            },


                            formatter:
                                function(
                                    value,
                                    context
                                ) {

                                    const item =
                                        noteData[
                                            context.dataIndex
                                        ];


                                    if (
                                        !item ||
                                        !item.percentage
                                    ) {

                                        return "";

                                    }


                                    return (
                                        Number(
                                            item.percentage.toFixed(
                                                1
                                            )
                                        ) +
                                        "%"
                                    );

                                }

                        }

                    }

                }

            }
        );

}


// =====================================================
// AMBIL GAMBAR GRAFIK BATANG
// =====================================================

function getChartImage() {

    if (
        !overtimeChartCanvas
    ) {

        return null;

    }


    try {

        return overtimeChartCanvas.toDataURL(
            "image/png",
            1.0
        );

    } catch (error) {

        console.error(
            "Gagal mengambil gambar grafik:",
            error
        );

        return null;

    }

}


// =====================================================
// AMBIL GAMBAR GRAFIK KETERANGAN
// =====================================================

function getNoteChartImage() {

    if (
        !overtimeNoteChartCanvas
    ) {

        return null;

    }


    try {

        return overtimeNoteChartCanvas.toDataURL(
            "image/png",
            1.0
        );

    } catch (error) {

        console.error(
            "Gagal mengambil gambar grafik keterangan:",
            error
        );

        return null;

    }

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
    // TOTAL JAM
    // =================================================

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


    // =================================================
    // TOTAL KONVERSI
    // =================================================

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


    // =================================================
    // USER COUNT
    // =================================================

    if (userCount) {

        userCount.textContent =
            data.length;

    }


    // =================================================
    // GRAND TOTAL CARD
    // =================================================

    if (grandTotal) {

        grandTotal.textContent =
            formatNumber(
                totalHours
            );

    }


    // =================================================
    // GRAND CONVERSION CARD
    // =================================================

    if (grandConversion) {

        grandConversion.textContent =
            formatNumber(
                totalConversion
            );

    }


    // =================================================
    // PERIODE
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
    // TABEL
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

                    Tidak ada data.

                </td>

            </tr>

        `;

    } else {

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
    // GRAND TOTAL TABEL
    // =================================================

    if (tableGrandTotal) {

        tableGrandTotal.textContent =
            formatNumber(
                totalHours
            );

    }


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


    // =================================================
    // GRAFIK BATANG
    // =================================================

    renderChart(
        data
    );


    // =================================================
    // GRAFIK LINGKARAN
    // =================================================

    renderNoteChart();

}


// =====================================================
// FILTER
// =====================================================

if (filterBtn) {

    filterBtn.addEventListener(
        "click",
        function () {

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
        function () {

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
        async function () {

            if (
                typeof ExcelJS ===
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


            const workbook =
                new ExcelJS.Workbook();


            const worksheet =
                workbook.addWorksheet(
                    "Summary Overtime"
                );


            // =================================================
            // JUDUL
            // =================================================

            worksheet.mergeCells(
                "A1:E1"
            );


            worksheet.getCell(
                "A1"
            ).value =
                "Summary Overtime";


            worksheet.getCell(
                "A1"
            ).font = {

                bold:
                    true,

                size:
                    16

            };


            worksheet.mergeCells(
                "A2:E2"
            );


            worksheet.getCell(
                "A2"
            ).value =
                "Periode: " +
                formatDate(
                    fromInput?.value
                ) +
                " s/d " +
                formatDate(
                    toInput?.value
                );


            worksheet.addRow([]);


            // =================================================
            // HEADER
            // =================================================

            const headerRow =
                worksheet.addRow([

                    "No",

                    "SAP ID",

                    "Nama User",

                    "Jumlah Jam",

                    "Konversi Lembur"

                ]);


            headerRow.eachCell(
                cell => {

                    cell.font = {

                        bold:
                            true,

                        color: {

                            argb:
                                "FFFFFFFF"

                        }

                    };


                    cell.fill = {

                        type:
                            "pattern",

                        pattern:
                            "solid",

                        fgColor: {

                            argb:
                                "4472C4"

                        }

                    };

                }
            );


            // =================================================
            // DATA
            // =================================================

            data.forEach(
                (
                    item,
                    index
                ) => {

                    worksheet.addRow([

                        index + 1,

                        item.sapId,

                        item.name,

                        Number(
                            item.hours || 0
                        ),

                        Number(
                            item.conversion || 0
                        )

                    ]);

                }
            );


            // =================================================
            // GRAND TOTAL
            // =================================================

            const totalRow =
                worksheet.addRow([

                    "",

                    "",

                    "GRAND TOTAL",

                    totalHours,

                    totalConversion

                ]);


            totalRow.eachCell(
                cell => {

                    cell.font = {

                        bold:
                            true

                    };

                }
            );


            // =================================================
            // WIDTH
            // =================================================

            worksheet.getColumn(1).width =
                8;

            worksheet.getColumn(2).width =
                18;

            worksheet.getColumn(3).width =
                30;

            worksheet.getColumn(4).width =
                18;

            worksheet.getColumn(5).width =
                22;


            // =================================================
            // GRAFIK BATANG EXCEL
            // =================================================

            const chartImage =
                getChartImage();


            if (
                chartImage
            ) {

                const imageId =
                    workbook.addImage({

                        base64:
                            chartImage,

                        extension:
                            "png"

                    });


                const startRow =
                    data.length + 8;


                worksheet.mergeCells(
                    `A${startRow}:E${startRow}`
                );


                worksheet.getCell(
                    `A${startRow}`
                ).value =
                    "Grafik Overtime Berdasarkan Nama User";


                worksheet.getCell(
                    `A${startRow}`
                ).font = {

                    bold:
                        true,

                    size:
                        14

                };


                worksheet.addImage(
                    imageId,
                    {

                        tl: {

                            col:
                                0,

                            row:
                                startRow

                        },

                        ext: {

                            width:
                                850,

                            height:
                                430

                        }

                    }
                );

            }


            // =================================================
            // DOWNLOAD EXCEL
            // =================================================

            const buffer =
                await workbook.xlsx.writeBuffer();


            const blob =
                new Blob(
                    [
                        buffer
                    ],
                    {

                        type:
                            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"

                    }
                );


            const url =
                URL.createObjectURL(
                    blob
                );


            const link =
                document.createElement(
                    "a"
                );


            link.href =
                url;


            link.download =
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
                ".xlsx";


            document.body.appendChild(
                link
            );


            link.click();


            document.body.removeChild(
                link
            );


            URL.revokeObjectURL(
                url
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
        function () {

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
                new jsPDF(
                    "landscape",
                    "mm",
                    "a4"
                );


            const pageWidth =
                doc.internal.pageSize.getWidth();


            const pageHeight =
                doc.internal.pageSize.getHeight();


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


            doc.setFont(
                "helvetica",
                "bold"
            );


            doc.setFontSize(
                16
            );


            doc.text(
                "Summary Overtime",
                14,
                13
            );


            doc.setFont(
                "helvetica",
                "normal"
            );


            doc.setFontSize(
                9
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
                20
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
                    25,

                margin: {

                    left:
                        14,

                    right:
                        14

                },

                theme:
                    "grid",

                styles: {

                    fontSize:
                        8,

                    cellPadding:
                        2,

                    valign:
                        "middle"

                },

                headStyles: {

                    fillColor:
                        [
                            68,
                            114,
                            196
                        ],

                    textColor:
                        255,

                    fontStyle:
                        "bold",

                    halign:
                        "center"

                },

                columnStyles: {

                    0: {

                        halign:
                            "center",

                        cellWidth:
                            12

                    },

                    1: {

                        cellWidth:
                            35

                    },

                    2: {

                        cellWidth:
                            75

                    },

                    3: {

                        halign:
                            "center",

                        cellWidth:
                            35

                    },

                    4: {

                        halign:
                            "center",

                        cellWidth:
                            40

                    }

                },

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

                ],

                footStyles: {

                    fillColor:
                        [
                            230,
                            230,
                            230
                        ],

                    textColor:
                        0,

                    fontStyle:
                        "bold",

                    halign:
                        "center"

                }

            });


            // =================================================
            // GRAFIK BATANG
            // =================================================

            const chartImage =
                getChartImage();


            if (
                chartImage
            ) {

                let chartY =
                    doc.lastAutoTable.finalY +
                    7;


                const chartTitleHeight =
                    6;


                const bottomMargin =
                    7;


                let chartHeight =
                    pageHeight -
                    chartY -
                    chartTitleHeight -
                    bottomMargin;


                if (
                    chartHeight >
                    65
                ) {

                    chartHeight =
                        65;

                }


                if (
                    chartHeight >
                    25
                ) {

                    doc.setFont(
                        "helvetica",
                        "bold"
                    );


                    doc.setFontSize(
                        10
                    );


                    doc.text(
                        "Grafik Overtime Berdasarkan Nama User",
                        14,
                        chartY
                    );


                    doc.addImage(
                        chartImage,
                        "PNG",
                        14,
                        chartY + 4,
                        pageWidth - 28,
                        chartHeight
                    );

                }

            }


            // =================================================
            // GRAFIK KETERANGAN DI PAGE BARU
            // =================================================

            const noteChartImage =
                getNoteChartImage();


            if (
                noteChartImage
            ) {

                doc.addPage();


                doc.setFont(
                    "helvetica",
                    "bold"
                );


                doc.setFontSize(
                    14
                );


                doc.text(
                    "Persentase Keterangan Overtime",
                    14,
                    15
                );


                doc.setFont(
                    "helvetica",
                    "normal"
                );


                doc.setFontSize(
                    9
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


                doc.addImage(
                    noteChartImage,
                    "PNG",
                    25,
                    30,
                    pageWidth - 50,
                    120
                );


                // =================================================
                // DETAIL PERSENTASE
                // =================================================

                const noteData =
                    getNoteSummary();


                let detailY =
                    160;


                doc.setFontSize(
                    10
                );


                doc.setFont(
                    "helvetica",
                    "bold"
                );


                doc.text(
                    "Detail Keterangan",
                    14,
                    detailY
                );


                detailY += 7;


                doc.setFont(
                    "helvetica",
                    "normal"
                );


                noteData.forEach(
                    item => {

                        doc.text(
                            item.note +
                            " : " +
                            item.count +
                            " data (" +
                            formatPercentage(
                                item.percentage
                            ) +
                            ")",
                            18,
                            detailY
                        );


                        detailY +=
                            6;


                        if (
                            detailY >
                            pageHeight - 10
                        ) {

                            doc.addPage();

                            detailY =
                                15;

                        }

                    }
                );

            }


            // =================================================
            // SAVE
            // =================================================

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
