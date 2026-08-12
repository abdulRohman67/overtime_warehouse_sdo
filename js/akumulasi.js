// =====================================================
// AKUMULASI OVERTIME
// USER
// FILTER + EXCEL + PDF
// =====================================================

import {
    get,
    ref
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-database.js";

import {
    db
} from "./firebase.js";

import {
    requireLogin
} from "./nav.js";


// =====================================================
// SESSION
// =====================================================

const session = requireLogin();

if (!session) {
    throw new Error("User belum login.");
}


// =====================================================
// ROLE
// =====================================================

const role = String(
    session.role || ""
)
.trim()
.toLowerCase();


if (role !== "user") {

    window.location.replace(
        "dashboard.html"
    );

    throw new Error(
        "Halaman hanya untuk user."
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

const countEl =
    document.getElementById("count");

const hoursEl =
    document.getElementById("hours");

const infoEl =
    document.getElementById("info");

const rowsEl =
    document.getElementById("rows");

const periodLabel =
    document.getElementById("periodLabel");

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

let overtimeData = [];


// =====================================================
// SAP ID
// =====================================================

function getSapId() {

    return String(

        session.sapId ||

        session.sapID ||

        session.SAPID ||

        session.userSap ||

        session.userID ||

        ""

    )
    .trim();

}


// =====================================================
// ESCAPE HTML
// =====================================================

function escapeHtml(value) {

    return String(
        value ?? ""
    )

    .replace(
        /&/g,
        "&amp;"
    )

    .replace(
        /</g,
        "&lt;"
    )

    .replace(
        />/g,
        "&gt;"
    )

    .replace(
        /"/g,
        "&quot;"
    )

    .replace(
        /'/g,
        "&#039;"
    );

}


// =====================================================
// FORMAT DATE
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
// DEFAULT DATE
// =====================================================

function setDefaultDate() {

    const today =
        new Date();

    const year =
        today.getFullYear();

    const month =
        String(
            today.getMonth() + 1
        ).padStart(2, "0");

    const day =
        String(
            today.getDate()
        ).padStart(2, "0");

    const current =
        `${year}-${month}-${day}`;

    fromInput.value =
        current;

    toInput.value =
        current;
}


// =====================================================
// LOAD OVERTIME
// =====================================================

async function loadOvertime() {

    const sapId =
        getSapId();


    if (!sapId) {

        throw new Error(
            "SAP ID user tidak ditemukan."
        );

    }


    const snapshot =
        await get(
            ref(
                db,
                "overtime"
            )
        );


    if (!snapshot.exists()) {

        overtimeData = [];

        return;

    }


    const raw =
        snapshot.val();


    overtimeData = [];


    Object.entries(raw)
        .forEach(
            ([key, item]) => {

                if (!item) {
                    return;
                }


                // =========================================
                // SAP ID DATA
                // =========================================

                const itemSap =
                    String(

                        item.userSap ??

                        item.sapId ??

                        item.sapID ??

                        item.userSapId ??

                        item.userId ??

                        item.userID ??

                        ""

                    )
                    .trim();


                // =========================================
                // HANYA USER LOGIN
                // =========================================

                if (
                    itemSap !== sapId
                ) {

                    return;

                }


                // =========================================
                // TANGGAL
                // =========================================

                const date =
                    String(

                        item.date ??

                        item.tanggal ??

                        ""

                    )
                    .trim();


                if (!date) {
                    return;
                }


                // =========================================
                // JAM
                // =========================================

                let hours =
                    Number(

                        item.hours ??

                        item.jam ??

                        item.jumlahJam ??

                        item.totalHours ??

                        0

                    );


                if (
                    !Number.isFinite(
                        hours
                    )
                ) {

                    hours = 0;

                }


                // =========================================
                // KETERANGAN
                // =========================================

                const note =
                    String(

                        item.keterangan ??

                        item.note ??

                        item.description ??

                        item.remark ??

                        "-"

                    )
                    .trim();


                overtimeData.push({

                    key,

                    date,

                    hours,

                    note

                });

            }
        );


    // =====================================================
    // SORT
    // =====================================================

    overtimeData.sort(
        (a, b) =>
            a.date.localeCompare(
                b.date
            )
    );

}


// =====================================================
// FILTER DATA
// =====================================================

function getFilteredData() {

    const from =
        fromInput.value;

    const to =
        toInput.value;


    if (
        !from ||
        !to
    ) {

        return [];

    }


    if (
        from > to
    ) {

        return null;

    }


    return overtimeData.filter(
        item => {

            return (
                item.date >= from &&
                item.date <= to
            );

        }
    );

}


// =====================================================
// TOTAL JAM
// =====================================================

function getTotalHours(
    data
) {

    return data.reduce(
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

}


// =====================================================
// RENDER
// =====================================================

function render() {

    const data =
        getFilteredData();


    if (data === null) {

        countEl.textContent =
            "0";

        hoursEl.textContent =
            "0";

        infoEl.textContent =
            "Tanggal Dari tidak boleh lebih besar dari tanggal Sampai.";

        rowsEl.innerHTML = `

            <tr>

                <td
                    colspan="4"
                    class="empty"
                >
                    Periksa kembali periode tanggal.
                </td>

            </tr>

        `;

        return;
    }


    const total =
        getTotalHours(
            data
        );


    countEl.textContent =
        data.length;

    hoursEl.textContent =
        total;


    periodLabel.textContent =
        `Periode: ${
            formatDate(
                fromInput.value
            )
        } s/d ${
            formatDate(
                toInput.value
            )
        }`;


    infoEl.textContent =
        `Menampilkan ${data.length} data overtime.`;


    if (
        data.length === 0
    ) {

        rowsEl.innerHTML = `

            <tr>

                <td
                    colspan="4"
                    class="empty"
                >
                    Tidak ada data overtime pada periode yang dipilih.
                </td>

            </tr>

        `;

        return;
    }


    rowsEl.innerHTML =
        data
        .map(
            (
                item,
                index
            ) => {

                return `

                    <tr>

                        <td>
                            ${index + 1}
                        </td>

                        <td>
                            ${escapeHtml(
                                formatDate(
                                    item.date
                                )
                            )}
                        </td>

                        <td>
                            ${item.hours}
                        </td>

                        <td>
                            ${escapeHtml(
                                item.note
                            )}
                        </td>

                    </tr>

                `;

            }
        )
        .join("");

}


// =====================================================
// FILTER BUTTON
// =====================================================

filterBtn.addEventListener(
    "click",
    render
);


// =====================================================
// RESET
// =====================================================

resetBtn.addEventListener(
    "click",
    () => {

        setDefaultDate();

        render();

    }
);


// =====================================================
// DOWNLOAD EXCEL
// TANPA LIBRARY
// =====================================================

function downloadExcel() {

    const data =
        getFilteredData();


    if (data === null) {

        alert(
            "Tanggal Dari tidak boleh lebih besar dari tanggal Sampai."
        );

        return;
    }


    if (
        data.length === 0
    ) {

        alert(
            "Tidak ada data overtime pada periode yang dipilih."
        );

        return;
    }


    const total =
        getTotalHours(
            data
        );


    const from =
        fromInput.value;

    const to =
        toInput.value;


    // =================================================
    // BUAT HTML UNTUK EXCEL
    // =================================================

    let html = `

<html>

<head>

<meta charset="UTF-8">

</head>

<body>

<h2>AKUMULASI OVERTIME</h2>

<table border="1">

<tr>

<td><b>SAP ID</b></td>

<td>
${escapeHtml(
    getSapId()
)}
</td>

</tr>

<tr>

<td><b>Nama</b></td>

<td>
${escapeHtml(
    session.name || "-"
)}
</td>

</tr>

<tr>

<td><b>Periode</b></td>

<td>
${formatDate(from)}
s/d
${formatDate(to)}
</td>

</tr>

</table>

<br>

<table border="1">

<thead>

<tr>

<th>No</th>

<th>Tanggal</th>

<th>Jam</th>

<th>Keterangan</th>

</tr>

</thead>

<tbody>
`;


    data.forEach(
        (
            item,
            index
        ) => {

            html += `

<tr>

<td>
${index + 1}
</td>

<td>
${escapeHtml(
    formatDate(
        item.date
    )
)}
</td>

<td>
${item.hours}
</td>

<td>
${escapeHtml(
    item.note
)}
</td>

</tr>

`;

        }
    );


    html += `

<tr>

<td colspan="2">

<b>GRAND TOTAL</b>

</td>

<td>

<b>
${total}
</b>

</td>

<td>

<b>
Jam
</b>

</td>

</tr>

</tbody>

</table>

</body>

</html>
`;


    // =================================================
    // BLOB EXCEL
    // =================================================

    const blob =
        new Blob(
            [html],
            {
                type:
                    "application/vnd.ms-excel"
            }
        );


    const url =
        URL.createObjectURL(
            blob
        );


    const a =
        document.createElement(
            "a"
        );


    a.href =
        url;

    a.download =
        `Akumulasi-Overtime-${from}-${to}.xls`;

    a.style.display =
        "none";


    document.body.appendChild(
        a
    );


    a.click();


    setTimeout(
        () => {

            document.body.removeChild(
                a
            );

            URL.revokeObjectURL(
                url
            );

        },
        1000
    );

}


// =====================================================
// LOAD jsPDF
// =====================================================

function loadJsPDF() {

    return new Promise(
        (
            resolve,
            reject
        ) => {

            if (
                window.jspdf &&
                window.jspdf.jsPDF
            ) {

                resolve(
                    window.jspdf.jsPDF
                );

                return;
            }


            const script =
                document.createElement(
                    "script"
                );


            script.src =
                "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";


            script.onload =
                () => {

                    if (
                        window.jspdf &&
                        window.jspdf.jsPDF
                    ) {

                        resolve(
                            window.jspdf.jsPDF
                        );

                    } else {

                        reject(
                            new Error(
                                "jsPDF tidak tersedia."
                            )
                        );

                    }

                };


            script.onerror =
                () => {

                    reject(
                        new Error(
                            "Gagal memuat jsPDF."
                        )
                    );

                };


            document.head.appendChild(
                script
            );

        }
    );

}


// =====================================================
// DOWNLOAD PDF
// =====================================================

async function downloadPdf() {

    const data =
        getFilteredData();


    if (data === null) {

        alert(
            "Tanggal Dari tidak boleh lebih besar dari tanggal Sampai."
        );

        return;
    }


    if (
        data.length === 0
    ) {

        alert(
            "Tidak ada data overtime pada periode yang dipilih."
        );

        return;
    }


    try {

        const jsPDF =
            await loadJsPDF();


        const doc =
            new jsPDF(
                "portrait",
                "mm",
                "a4"
            );


        const from =
            fromInput.value;

        const to =
            toInput.value;


        const total =
            getTotalHours(
                data
            );


        // =================================================
        // HEADER
        // =================================================

        doc.setFontSize(
            16
        );

        doc.setFont(
            "helvetica",
            "bold"
        );


        doc.text(
            "AKUMULASI OVERTIME",
            14,
            18
        );


        doc.setFontSize(
            10
        );

        doc.setFont(
            "helvetica",
            "normal"
        );


        doc.text(
            `SAP ID: ${getSapId()}`,
            14,
            27
        );


        doc.text(
            `Nama: ${session.name || "-"}`,
            14,
            33
        );


        doc.text(
            `Periode: ${formatDate(from)} s/d ${formatDate(to)}`,
            14,
            39
        );


        // =================================================
        // TABLE
        // =================================================

        let y = 50;


        doc.setFont(
            "helvetica",
            "bold"
        );


        doc.rect(
            14,
            y - 6,
            182,
            8
        );


        doc.text(
            "No",
            16,
            y
        );


        doc.text(
            "Tanggal",
            30,
            y
        );


        doc.text(
            "Jam",
            65,
            y
        );


        doc.text(
            "Keterangan",
            85,
            y
        );


        y += 8;


        doc.setFont(
            "helvetica",
            "normal"
        );


        data.forEach(
            (
                item,
                index
            ) => {

                if (
                    y > 275
                ) {

                    doc.addPage();

                    y = 20;


                    doc.setFont(
                        "helvetica",
                        "bold"
                    );


                    doc.rect(
                        14,
                        y - 6,
                        182,
                        8
                    );


                    doc.text(
                        "No",
                        16,
                        y
                    );


                    doc.text(
                        "Tanggal",
                        30,
                        y
                    );


                    doc.text(
                        "Jam",
                        65,
                        y
                    );


                    doc.text(
                        "Keterangan",
                        85,
                        y
                    );


                    y += 8;


                    doc.setFont(
                        "helvetica",
                        "normal"
                    );

                }


                const note =
                    String(
                        item.note || "-"
                    );


                const shortNote =
                    note.length > 60

                    ? note.substring(
                        0,
                        60
                    ) + "..."

                    : note;


                doc.rect(
                    14,
                    y - 6,
                    182,
                    8
                );


                doc.text(
                    String(
                        index + 1
                    ),
                    16,
                    y
                );


                doc.text(
                    formatDate(
                        item.date
                    ),
                    30,
                    y
                );


                doc.text(
                    String(
                        item.hours
                    ),
                    65,
                    y
                );


                doc.text(
                    shortNote,
                    85,
                    y
                );


                y += 8;

            }
        );


        // =================================================
        // GRAND TOTAL
        // =================================================

        if (
            y > 270
        ) {

            doc.addPage();

            y = 20;

        }


        y += 5;


        doc.setFont(
            "helvetica",
            "bold"
        );


        doc.rect(
            14,
            y - 6,
            182,
            9
        );


        doc.text(
            "GRAND TOTAL",
            30,
            y
        );


        doc.text(
            String(total),
            65,
            y
        );


        doc.text(
            "Jam",
            85,
            y
        );


        // =================================================
        // DOWNLOAD
        // =================================================

        doc.save(
            `Akumulasi-Overtime-${from}-${to}.pdf`
        );

    } catch (error) {

        console.error(
            "PDF ERROR:",
            error
        );


        alert(
            "PDF gagal dibuat. Periksa koneksi internet kemudian coba lagi."
        );

    }

}


// =====================================================
// EVENT DOWNLOAD EXCEL
// =====================================================

if (
    downloadExcelBtn
) {

    downloadExcelBtn.addEventListener(
        "click",
        downloadExcel
    );

}


// =====================================================
// EVENT DOWNLOAD PDF
// =====================================================

if (
    downloadPdfBtn
) {

    downloadPdfBtn.addEventListener(
        "click",
        downloadPdf
    );

}


// =====================================================
// START
// =====================================================

async function init() {

    try {

        rowsEl.innerHTML = `

            <tr>

                <td
                    colspan="4"
                    class="empty"
                >
                    Memuat data...
                </td>

            </tr>

        `;


        await loadOvertime();


        setDefaultDate();


        render();


    } catch (error) {

        console.error(
            "Akumulasi error:",
            error
        );


        countEl.textContent =
            "0";

        hoursEl.textContent =
            "0";


        infoEl.textContent =
            error.message ||
            "Gagal membaca data overtime.";


        rowsEl.innerHTML = `

            <tr>

                <td
                    colspan="4"
                    class="empty"
                >
                    Gagal membaca data dari Firebase.
                </td>

            </tr>

        `;

    }

}


init();