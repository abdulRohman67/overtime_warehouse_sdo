import {
    db
} from "./firebase.js";

import {
    ref,
    onValue,
    push,
    set,
    remove,
    get
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-database.js";

import {
    requireLogin
} from "./nav.js";

import {
    showMsg,
    esc
} from "./session.js";


/* =====================================================
   SESSION
===================================================== */

const s = requireLogin();


if (
    !s ||
    String(s.role || "").toLowerCase() !== "admin"
) {

    location.href = "dashboard.html";

    throw new Error(
        "Akses hanya untuk administrator."
    );

}


/* =====================================================
   DATA
===================================================== */

let all = [];

let users = {};


/* =====================================================
   ELEMENT
===================================================== */

const category =
    document.getElementById("category");

const start =
    document.getElementById("start");

const end =
    document.getElementById("end");

const hours =
    document.getElementById("hours");

const conversionHours =
    document.getElementById("conversionHours");

const date =
    document.getElementById("date");

const userSap =
    document.getElementById("userSap");

const note =
    document.getElementById("note");

const search =
    document.getElementById("search");

const rows =
    document.getElementById("rows");

const otForm =
    document.getElementById("otForm");

const editId =
    document.getElementById("editId");

const resetBtn =
    document.getElementById("resetBtn");

const msg =
    document.getElementById("msg");


/* =====================================================
   ELEMENT EXCEL
===================================================== */

const excelFile =
    document.getElementById("excelFile");

const uploadExcelBtn =
    document.getElementById("uploadExcelBtn");

const downloadTemplateBtn =
    document.getElementById("downloadTemplateBtn");

const excelMsg =
    document.getElementById("excelMsg");


/* =====================================================
   CHECKBOX
===================================================== */

const selectAll =
    document.getElementById("selectAll");

const deleteSelectedBtn =
    document.getElementById("deleteSelectedBtn");

const selectedCount =
    document.getElementById("selectedCount");


/* =====================================================
   KATEGORI OVERTIME
===================================================== */

const overtimeCategory = {

    IOR1: {
        start: "13:00",
        end: "15:00",
        hours: 2
    },

    IOR2: {
        start: "21:00",
        end: "23:00",
        hours: 2
    },

    IOR3: {
        start: "05:00",
        end: "07:00",
        hours: 2
    },

    IPN1: {
        start: "19:00",
        end: "23:00",
        hours: 4
    },

    IPM1: {
        start: "15:00",
        end: "19:00",
        hours: 4
    }

};


/* =====================================================
   HITUNG JAM OVERTIME
===================================================== */

function calculateHours(value) {

    const total =
        Number(value) || 0;


    if (total === 4) {
        return 3.5;
    }


    if (total === 11) {
        return 10.5;
    }


    return total;

}


/* =====================================================
   HITUNG KONVERSI
===================================================== */

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


/* =====================================================
   AMBIL KONVERSI DATA
===================================================== */

function getConversionHours(x) {

    if (
        x &&
        x.conversionHours !== undefined &&
        x.conversionHours !== null &&
        x.conversionHours !== ""
    ) {

        const value =
            Number(
                x.conversionHours
            );


        if (
            Number.isFinite(value)
        ) {

            return value;

        }

    }


    return calculateConversionHours(
        x?.hours || 0
    );

}


/* =====================================================
   FORMAT ANGKA
===================================================== */

function formatNumber(value) {

    const number =
        Number(value) || 0;


    return Number(
        number.toFixed(2)
    ).toString();

}


/* =====================================================
   KATEGORI BERUBAH
===================================================== */

if (category) {

    category.addEventListener(
        "change",
        () => {

            const x =
                overtimeCategory[
                    category.value
                ];


            if (!x) {

                start.value = "";

                end.value = "";

                hours.value = "";

                conversionHours.value = "";

                return;

            }


            start.value =
                x.start;


            end.value =
                x.end;


            hours.value =
                calculateHours(
                    x.hours
                );


            conversionHours.value =
                calculateConversionHours(
                    hours.value
                );

        }
    );

}


/* =====================================================
   JUMLAH JAM BERUBAH
===================================================== */

if (hours) {

    hours.addEventListener(
        "input",
        () => {

            const inputHours =
                Number(
                    hours.value
                ) || 0;


            const totalHours =
                calculateHours(
                    inputHours
                );


            conversionHours.value =
                calculateConversionHours(
                    totalHours
                );

        }
    );

}


/* =====================================================
   LOAD USERS
===================================================== */

onValue(

    ref(
        db,
        "users"
    ),

    snap => {

        users =
            snap.exists()
                ? snap.val()
                : {};


        if (userSap) {

            userSap.innerHTML =
                '<option value="">Pilih user</option>';


            Object.entries(users)

                .filter(
                    ([key, user]) =>
                        String(
                            user?.role || ""
                        )
                            .toLowerCase() ===
                        "user"
                )

                .sort(
                    ([a], [b]) =>
                        String(a)
                            .localeCompare(
                                String(b)
                            )
                )

                .forEach(
                    ([key, user]) => {

                        userSap.insertAdjacentHTML(

                            "beforeend",

                            `
                            <option value="${esc(key)}">
                                ${esc(key)} - ${esc(user?.name || "")}
                            </option>
                            `

                        );

                    }
                );

        }


        render();

    }

);


/* =====================================================
   LOAD OVERTIME
===================================================== */

onValue(

    ref(
        db,
        "overtime"
    ),

    snap => {

        all =

            snap.exists()

                ?

                Object.entries(
                    snap.val()
                ).map(
                    ([id, x]) => ({
                        id,
                        ...(x || {})
                    })
                )

                :

                [];


        render();

    }

);


/* =====================================================
   RENDER
===================================================== */

function render() {

    if (!rows) {
        return;
    }


    const q =
        String(
            search?.value || ""
        )
            .toLowerCase()
            .trim();


    const data =
        all

            .filter(
                x => {

                    const text =

                        `${x?.userSap || ""} ` +

                        `${users[
                            x?.userSap
                        ]?.name || ""} ` +

                        `${x?.date || ""} ` +

                        `${x?.category || ""} ` +

                        `${x?.note || ""}`;


                    return (
                        !q ||
                        text
                            .toLowerCase()
                            .includes(q)
                    );

                }
            )

            .sort(
                (a, b) => {

                    return String(
                        b?.date || ""
                    ).localeCompare(
                        String(
                            a?.date || ""
                        )
                    );

                }
            );


    if (!data.length) {

        rows.innerHTML = `

            <tr>

                <td
                    colspan="10"
                    class="empty"
                >
                    Belum ada data.
                </td>

            </tr>

        `;


        resetCheckboxState();

        return;

    }


    rows.innerHTML =

        data

            .map(
                x => {

                    const conversion =
                        getConversionHours(x);


                    return `

                        <tr>

                            <td
                                style="
                                    text-align:center;
                                "
                            >

                                <input
                                    type="checkbox"
                                    class="rowCheck"
                                    data-id="${esc(x.id)}"
                                >

                            </td>


                            <td>
                                ${esc(
                                    x?.date || ""
                                )}
                            </td>


                            <td>
                                ${esc(
                                    x?.userSap || ""
                                )}
                            </td>


                            <td>
                                ${esc(
                                    users[
                                        x?.userSap
                                    ]?.name || ""
                                )}
                            </td>


                            <td>
                                ${esc(
                                    x?.start || ""
                                )}
                            </td>


                            <td>
                                ${esc(
                                    x?.end || ""
                                )}
                            </td>


                            <td>
                                ${formatNumber(
                                    x?.hours || 0
                                )}
                            </td>


                            <td>
                                ${formatNumber(
                                    conversion
                                )}
                            </td>


                            <td>
                                ${esc(
                                    x?.note || ""
                                )}
                            </td>


                            <td class="actions">

                                <button
                                    type="button"
                                    data-edit="${esc(x.id)}"
                                >
                                    Edit
                                </button>


                                <button
                                    type="button"
                                    class="danger"
                                    data-del="${esc(x.id)}"
                                >
                                    Hapus
                                </button>

                            </td>

                        </tr>

                    `;

                }
            )

            .join("");


    restoreSelectedCheckboxes();

    updateSelectedCount();

}


/* =====================================================
   CHECKBOX TERPILIH
===================================================== */

function getSelectedIds() {

    return Array.from(
        document.querySelectorAll(
            ".rowCheck:checked"
        )
    ).map(
        checkbox =>
            checkbox.dataset.id
    );

}


/* =====================================================
   RESTORE CHECKBOX
===================================================== */

function restoreSelectedCheckboxes() {

    const selectedIds =
        window.selectedOvertimeIds || [];


    document
        .querySelectorAll(
            ".rowCheck"
        )
        .forEach(
            checkbox => {

                checkbox.checked =
                    selectedIds.includes(
                        checkbox.dataset.id
                    );

            }
        );

}


/* =====================================================
   UPDATE JUMLAH
===================================================== */

function updateSelectedCount() {

    const checked =
        document.querySelectorAll(
            ".rowCheck:checked"
        );


    const ids =
        Array.from(
            checked
        ).map(
            checkbox =>
                checkbox.dataset.id
        );


    window.selectedOvertimeIds =
        ids;


    if (selectedCount) {

        selectedCount.textContent =
            `${ids.length} data dipilih`;

    }


    const allCheckboxes =
        document.querySelectorAll(
            ".rowCheck"
        );


    if (selectAll) {

        selectAll.checked =
            allCheckboxes.length > 0 &&
            checked.length ===
            allCheckboxes.length;

    }

}


/* =====================================================
   RESET CHECKBOX
===================================================== */

function resetCheckboxState() {

    window.selectedOvertimeIds = [];


    if (selectAll) {

        selectAll.checked =
            false;

    }


    if (selectedCount) {

        selectedCount.textContent =
            "0 data dipilih";

    }

}


/* =====================================================
   PILIH SEMUA
===================================================== */

if (selectAll) {

    selectAll.addEventListener(
        "change",
        () => {

            const checked =
                selectAll.checked;


            document
                .querySelectorAll(
                    ".rowCheck"
                )
                .forEach(
                    checkbox => {

                        checkbox.checked =
                            checked;

                    }
                );


            updateSelectedCount();

        }
    );

}


/* =====================================================
   CHECKBOX INDIVIDUAL
===================================================== */

if (rows) {

    rows.addEventListener(
        "change",
        e => {

            if (
                e.target.classList.contains(
                    "rowCheck"
                )
            ) {

                updateSelectedCount();

            }

        }
    );

}


/* =====================================================
   SEARCH
===================================================== */

if (search) {

    search.addEventListener(
        "input",
        render
    );

}


/* =====================================================
   SIMPAN MANUAL
===================================================== */

if (otForm) {

    otForm.addEventListener(
        "submit",
        async e => {

            e.preventDefault();


            const inputHours =
                Number(
                    hours?.value
                ) || 0;


            if (inputHours <= 0) {

                alert(
                    "Jumlah jam overtime harus lebih dari 0."
                );

                return;

            }


            const totalHours =
                calculateHours(
                    inputHours
                );


            const totalConversionHours =
                calculateConversionHours(
                    totalHours
                );


            const finalDate =
                String(
                    date?.value || ""
                ).trim();


            if (!finalDate) {

                alert(
                    "Tanggal harus diisi."
                );

                return;

            }


            const data = {

                date:
                    finalDate,

                start:
                    start?.value || "",

                end:
                    end?.value || "",

                hours:
                    totalHours,

                conversionHours:
                    totalConversionHours,

                userSap:
                    userSap?.value || "",

                category:
                    category?.value || "",

                note:
                    note?.value.trim() || "",

                updatedAt:
                    Date.now()

            };


            const id =

                editId?.value

                    ?

                editId.value

                    :

                push(
                    ref(
                        db,
                        "overtime"
                    )
                ).key;


            await set(

                ref(
                    db,
                    "overtime/" + id
                ),

                data

            );


            if (msg) {

                showMsg(
                    msg,
                    "Data overtime berhasil disimpan.",
                    "ok"
                );

            }


            reset();

        }
    );

}


/* =====================================================
   RESET FORM
===================================================== */

function reset() {

    if (otForm) {
        otForm.reset();
    }


    if (editId) {
        editId.value = "";
    }


    if (conversionHours) {
        conversionHours.value = "";
    }

}


/* =====================================================
   RESET BUTTON
===================================================== */

if (resetBtn) {

    resetBtn.addEventListener(
        "click",
        reset
    );

}


/* =====================================================
   EXCEL BUTTON
===================================================== */

if (uploadExcelBtn) {

    uploadExcelBtn.addEventListener(
        "click",
        uploadExcel
    );

}


if (downloadTemplateBtn) {

    downloadTemplateBtn.addEventListener(
        "click",
        downloadExcelTemplate
    );

}


/* =====================================================
   NORMALISASI HEADER EXCEL
===================================================== */

function normalizeHeader(value) {

    return String(value || "")
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "")
        .replace(/[_-]/g, "");

}


/* =====================================================
   AMBIL DATA KOLOM EXCEL
===================================================== */

function getExcelValue(
    row,
    names
) {

    const keys =
        Object.keys(
            row || {}
        );


    for (const name of names) {

        const target =
            normalizeHeader(name);


        const found =
            keys.find(
                key =>
                    normalizeHeader(key) ===
                    target
            );


        if (
            found !== undefined
        ) {

            return row[found];

        }

    }


    return "";

}


/* =====================================================
   FORMAT TANGGAL EXCEL
   PENTING:
   TIDAK MENGGUNAKAN new Date()
   UNTUK PARSING TANGGAL EXCEL.
===================================================== */

function formatExcelDate(value) {

    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {

        return "";

    }


    /* =================================================
       STRING
    ================================================= */

    if (typeof value === "string") {

        const stringValue =
            value.trim();


        if (!stringValue) {
            return "";
        }


        /* ---------------------------------------------
           YYYY-MM-DD
        --------------------------------------------- */

        let match =
            stringValue.match(
                /^(\d{4})-(\d{1,2})-(\d{1,2})$/
            );


        if (match) {

            const year =
                Number(match[1]);

            const month =
                Number(match[2]);

            const day =
                Number(match[3]);


            if (
                month >= 1 &&
                month <= 12 &&
                day >= 1 &&
                day <= 31
            ) {

                return buildDateString(
                    year,
                    month,
                    day
                );

            }

        }


        /* ---------------------------------------------
           MM/DD/YY
           
           Contoh:
           08/11/26
           menjadi:
           2026-08-11
        --------------------------------------------- */

        match =
            stringValue.match(
                /^(\d{1,2})\/(\d{1,2})\/(\d{2})$/
            );


        if (match) {

            const month =
                Number(match[1]);

            const day =
                Number(match[2]);

            const shortYear =
                Number(match[3]);


            const year =
                shortYear >= 50
                    ? 1900 + shortYear
                    : 2000 + shortYear;


            if (
                month >= 1 &&
                month <= 12 &&
                day >= 1 &&
                day <= 31
            ) {

                return buildDateString(
                    year,
                    month,
                    day
                );

            }

        }


        /* ---------------------------------------------
           MM/DD/YYYY
        --------------------------------------------- */

        match =
            stringValue.match(
                /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/
            );


        if (match) {

            const month =
                Number(match[1]);

            const day =
                Number(match[2]);

            const year =
                Number(match[3]);


            if (
                month >= 1 &&
                month <= 12 &&
                day >= 1 &&
                day <= 31
            ) {

                return buildDateString(
                    year,
                    month,
                    day
                );

            }

        }


        /* ---------------------------------------------
           DD-MM-YYYY
        --------------------------------------------- */

        match =
            stringValue.match(
                /^(\d{1,2})-(\d{1,2})-(\d{4})$/
            );


        if (match) {

            const day =
                Number(match[1]);

            const month =
                Number(match[2]);

            const year =
                Number(match[3]);


            if (
                month >= 1 &&
                month <= 12 &&
                day >= 1 &&
                day <= 31
            ) {

                return buildDateString(
                    year,
                    month,
                    day
                );

            }

        }


        return stringValue;

    }


    /* =================================================
       EXCEL SERIAL DATE

       Contoh:
       45880
       45881
       dst.

       Diproses menggunakan XLSX.SSF
       TANPA new Date().
    ================================================= */

    if (
        typeof value === "number" &&
        Number.isFinite(value)
    ) {

        if (
            window.XLSX &&
            XLSX.SSF &&
            typeof XLSX.SSF.parse_date_code ===
                "function"
        ) {

            const parsed =
                XLSX.SSF.parse_date_code(
                    value
                );


            if (parsed) {

                const year =
                    Number(parsed.y);

                const month =
                    Number(parsed.m);

                const day =
                    Number(parsed.d);


                if (
                    year > 0 &&
                    month >= 1 &&
                    month <= 12 &&
                    day >= 1 &&
                    day <= 31
                ) {

                    return buildDateString(
                        year,
                        month,
                        day
                    );

                }

            }

        }

    }


    /* =================================================
       JIKA BENAR-BENAR Date
       
       Gunakan getFullYear/getMonth/getDate.
       JANGAN menggunakan toISOString().
    ================================================= */

    if (
        value instanceof Date &&
        !isNaN(value.getTime())
    ) {

        return buildDateString(
            value.getFullYear(),
            value.getMonth() + 1,
            value.getDate()
        );

    }


    return String(value).trim();

}


/* =====================================================
   BUILD DATE STRING
===================================================== */

function buildDateString(
    year,
    month,
    day
) {

    return (

        String(year)
            .padStart(4, "0")

        + "-" +

        String(month)
            .padStart(2, "0")

        + "-" +

        String(day)
            .padStart(2, "0")

    );

}


/* =====================================================
   FORMAT JAM EXCEL
===================================================== */

function formatExcelTime(value) {

    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {

        return "";

    }


    if (
        typeof value === "string"
    ) {

        const stringValue =
            value.trim();


        let match =
            stringValue.match(
                /^(\d{1,2}):(\d{1,2})/
            );


        if (match) {

            const hour =
                Number(match[1]);

            const minute =
                Number(match[2]);


            if (
                hour >= 0 &&
                hour <= 23 &&
                minute >= 0 &&
                minute <= 59
            ) {

                return (

                    String(hour)
                        .padStart(2, "0")

                    + ":" +

                    String(minute)
                        .padStart(2, "0")

                );

            }

        }


        return stringValue;

    }


    if (
        typeof value === "number" &&
        Number.isFinite(value)
    ) {

        let totalMinutes =
            Math.round(
                value * 24 * 60
            );


        totalMinutes =
            totalMinutes %
            (24 * 60);


        if (totalMinutes < 0) {
            totalMinutes += 24 * 60;
        }


        const hour =
            Math.floor(
                totalMinutes / 60
            );


        const minute =
            totalMinutes % 60;


        return (

            String(hour)
                .padStart(2, "0")

            + ":" +

            String(minute)
                .padStart(2, "0")

        );

    }


    if (
        value instanceof Date &&
        !isNaN(value.getTime())
    ) {

        return (

            String(
                value.getHours()
            ).padStart(2, "0")

            + ":" +

            String(
                value.getMinutes()
            ).padStart(2, "0")

        );

    }


    return String(value).trim();

}


/* =====================================================
   PARSE ANGKA EXCEL
===================================================== */

function parseExcelNumber(value) {

    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {

        return 0;

    }


    if (
        typeof value === "number"
    ) {

        return Number.isFinite(value)
            ? value
            : 0;

    }


    const stringValue =
        String(value)
            .trim()
            .replace(",", ".");


    const number =
        Number(
            stringValue
        );


    if (
        Number.isFinite(number)
    ) {

        return number;

    }


    const match =
        stringValue.match(
            /^(\d+(?:\.\d+)?)\s*:\s*(\d+)$/
        );


    if (match) {

        const hour =
            Number(match[1]);

        const minute =
            Number(match[2]);


        return (
            hour +
            minute / 60
        );

    }


    return 0;

}


/* =====================================================
   PESAN EXCEL
===================================================== */

function showExcelMsg(
    text,
    type = "ok"
) {

    if (!excelMsg) {
        return;
    }


    excelMsg.textContent =
        text;


    excelMsg.style.whiteSpace =
        "pre-line";


    if (
        type === "error"
    ) {

        excelMsg.style.color =
            "#b91c1c";

    } else {

        excelMsg.style.color =
            "";

    }

}


/* =====================================================
   UPLOAD EXCEL
===================================================== */

async function uploadExcel() {

    try {

        if (
            !excelFile ||
            !excelFile.files ||
            !excelFile.files.length
        ) {

            alert(
                "Silakan pilih file Excel terlebih dahulu."
            );

            return;

        }


        const file =
            excelFile.files[0];


        const fileName =
            file.name.toLowerCase();


        if (
            !fileName.endsWith(".xlsx") &&
            !fileName.endsWith(".xls")
        ) {

            alert(
                "File harus berformat Excel (.xlsx atau .xls)."
            );

            return;

        }


        showExcelMsg(
            "Sedang membaca file Excel...",
            "ok"
        );


        const buffer =
            await file.arrayBuffer();


        /* =================================================
           PENTING:
           cellDates FALSE

           Supaya tanggal tidak diubah menjadi
           JavaScript Date yang rawan timezone.
        ================================================= */

        const workbook =
            XLSX.read(
                buffer,
                {
                    type: "array",
                    cellDates: false,
                    cellNF: true,
                    cellText: true
                }
            );


        if (
            !workbook.SheetNames.length
        ) {

            throw new Error(
                "Sheet Excel tidak ditemukan."
            );

        }


        const sheet =
            workbook.Sheets[
                workbook.SheetNames[0]
            ];


        /* =================================================
           raw TRUE

           Kita ingin nilai Excel asli.
        ================================================= */

        const dataExcel =
            XLSX.utils.sheet_to_json(
                sheet,
                {
                    defval: "",
                    raw: true
                }
            );


        if (
            !dataExcel.length
        ) {

            throw new Error(
                "Data Excel kosong."
            );

        }


        let berhasil = 0;

        let gagal = 0;

        const errors = [];


        /* =================================================
           PROSES SETIAP BARIS
        ================================================= */

        for (
            let i = 0;
            i < dataExcel.length;
            i++
        ) {

            const row =
                dataExcel[i];


            try {

                /* =========================================
                   TANGGAL
                ========================================== */

                const rowDate =
                    getExcelValue(
                        row,
                        [
                            "Tanggal",
                            "Date",
                            "Tgl"
                        ]
                    );


                /* =========================================
                   SAP
                ========================================== */

                const rowSap =
                    getExcelValue(
                        row,
                        [
                            "SAP",
                            "SAP ID",
                            "SAPID",
                            "User SAP",
                            "UserSap"
                        ]
                    );


                /* =========================================
                   KATEGORI
                ========================================== */

                const rowCategory =
                    getExcelValue(
                        row,
                        [
                            "Kategori",
                            "Kategori Overtime",
                            "Category"
                        ]
                    );


                /* =========================================
                   MULAI
                ========================================== */

                let rowStart =
                    getExcelValue(
                        row,
                        [
                            "Mulai",
                            "Jam Mulai",
                            "Start"
                        ]
                    );


                /* =========================================
                   SELESAI
                ========================================== */

                let rowEnd =
                    getExcelValue(
                        row,
                        [
                            "Selesai",
                            "Jam Selesai",
                            "End"
                        ]
                    );


                /* =========================================
                   JAM
                ========================================== */

                const rowHours =
                    getExcelValue(
                        row,
                        [
                            "Jam",
                            "Jumlah Jam",
                            "Hours"
                        ]
                    );


                /* =========================================
                   KONVERSI
                ========================================== */

                const rowConversion =
                    getExcelValue(
                        row,
                        [
                            "Konversi",
                            "Konversi Jam",
                            "Conversion",
                            "ConversionHours"
                        ]
                    );


                /* =========================================
                   CATATAN
                ========================================== */

                const rowNote =
                    getExcelValue(
                        row,
                        [
                            "Keterangan",
                            "Note",
                            "Catatan"
                        ]
                    );


                /* =========================================
                   VALIDASI SAP
                ========================================== */

                const sap =
                    String(
                        rowSap || ""
                    ).trim();


                if (!sap) {

                    throw new Error(
                        "SAP kosong"
                    );

                }


                if (!users[sap]) {

                    throw new Error(
                        `SAP ${sap} tidak ditemukan di data users`
                    );

                }


                /* =========================================
                   TANGGAL

                   INI BAGIAN PALING PENTING
                ========================================== */

                const finalDate =
                    formatExcelDate(
                        rowDate
                    );


                if (!finalDate) {

                    throw new Error(
                        "Tanggal kosong/tidak valid"
                    );

                }


                /* =========================================
                   VALIDASI FORMAT FINAL
                ========================================== */

                if (
                    !/^\d{4}-\d{2}-\d{2}$/
                        .test(finalDate)
                ) {

                    throw new Error(
                        `Format tanggal tidak valid: ${finalDate}`
                    );

                }


                /* =========================================
                   KATEGORI
                ========================================== */

                const finalCategory =
                    String(
                        rowCategory || ""
                    )
                        .trim()
                        .toUpperCase();


                if (!finalCategory) {

                    throw new Error(
                        "Kategori kosong"
                    );

                }


                const categoryData =
                    overtimeCategory[
                        finalCategory
                    ];


                if (!categoryData) {

                    throw new Error(
                        `Kategori ${finalCategory} tidak valid`
                    );

                }


                /* =========================================
                   JAM MULAI
                ========================================== */

                rowStart =
                    formatExcelTime(
                        rowStart
                    );


                if (!rowStart) {

                    rowStart =
                        categoryData.start;

                }


                /* =========================================
                   JAM SELESAI
                ========================================== */

                rowEnd =
                    formatExcelTime(
                        rowEnd
                    );


                if (!rowEnd) {

                    rowEnd =
                        categoryData.end;

                }


                /* =========================================
                   JAM OVERTIME
                ========================================== */

                let rawHours =
                    parseExcelNumber(
                        rowHours
                    );


                if (
                    rawHours <= 0
                ) {

                    rawHours =
                        Number(
                            categoryData.hours
                        ) || 0;

                }


                if (
                    rawHours <= 0
                ) {

                    throw new Error(
                        "Jumlah jam tidak valid"
                    );

                }


                const finalHours =
                    calculateHours(
                        rawHours
                    );


                /* =========================================
                   KONVERSI
                ========================================== */

                let finalConversion;


                if (
                    rowConversion !== "" &&
                    rowConversion !== null &&
                    rowConversion !== undefined
                ) {

                    const excelConversion =
                        parseExcelNumber(
                            rowConversion
                        );


                    if (
                        excelConversion > 0
                    ) {

                        finalConversion =
                            excelConversion;

                    } else {

                        finalConversion =
                            calculateConversionHours(
                                finalHours
                            );

                    }

                } else {

                    finalConversion =
                        calculateConversionHours(
                            finalHours
                        );

                }


                /* =========================================
                   CATATAN
                ========================================== */

                const finalNote =
                    String(
                        rowNote || ""
                    ).trim();


                /* =========================================
                   DATA FIREBASE

                   TANGGAL DISIMPAN SEBAGAI STRING
                   YYYY-MM-DD
                ========================================== */

                const firebaseData = {

                    date:
                        finalDate,

                    start:
                        rowStart,

                    end:
                        rowEnd,

                    hours:
                        finalHours,

                    conversionHours:
                        finalConversion,

                    userSap:
                        sap,

                    category:
                        finalCategory,

                    note:
                        finalNote,

                    updatedAt:
                        Date.now(),

                    importedFrom:
                        "excel"

                };


                /* =========================================
                   SIMPAN FIREBASE
                ========================================== */

                const newRef =
                    push(
                        ref(
                            db,
                            "overtime"
                        )
                    );


                await set(
                    newRef,
                    firebaseData
                );


                berhasil++;

            } catch (error) {

                gagal++;


                errors.push(
                    `Baris ${i + 2}: ${error.message}`
                );

            }

        }


        /* =================================================
           HASIL
        ================================================= */

        let resultMessage =
            `Upload selesai.\n` +
            `Berhasil: ${berhasil} data.\n` +
            `Gagal: ${gagal} data.`;


        if (errors.length) {

            resultMessage +=
                "\n\nDetail data gagal:\n" +
                errors.join("\n");

        }


        showExcelMsg(
            resultMessage,
            gagal
                ? "error"
                : "ok"
        );


        if (excelFile) {
            excelFile.value = "";
        }


        render();


    } catch (error) {

        console.error(
            "Upload Excel error:",
            error
        );


        showExcelMsg(
            "Upload gagal: " +
            error.message,
            "error"
        );

    }

}


/* =====================================================
   DOWNLOAD TEMPLATE EXCEL
===================================================== */

function downloadExcelTemplate() {

    try {

        const templateData = [

            {
                "Tanggal": "2026-08-20",
                "SAP": "10001",
                "Kategori": "IOR1",
                "Mulai": "13:00",
                "Selesai": "15:00",
                "Jam": 2,
                "Keterangan": "Contoh overtime"
            },

            {
                "Tanggal": "2026-08-21",
                "SAP": "10002",
                "Kategori": "IPN1",
                "Mulai": "19:00",
                "Selesai": "23:00",
                "Jam": 4,
                "Keterangan": "Contoh overtime"
            },

            {
                "Tanggal": "",
                "SAP": "",
                "Kategori": "",
                "Mulai": "",
                "Selesai": "",
                "Jam": "",
                "Keterangan": ""
            }

        ];


        const worksheet =
            XLSX.utils.json_to_sheet(
                templateData
            );


        worksheet["!cols"] = [

            { wch: 15 },

            { wch: 15 },

            { wch: 15 },

            { wch: 12 },

            { wch: 12 },

            { wch: 10 },

            { wch: 30 }

        ];


        const workbook =
            XLSX.utils.book_new();


        XLSX.utils.book_append_sheet(
            workbook,
            worksheet,
            "Template Overtime"
        );


        const instructionData = [

            {
                "Kolom": "Tanggal",
                "Keterangan":
                    "Gunakan format YYYY-MM-DD, contoh 2026-08-20"
            },

            {
                "Kolom": "SAP",
                "Keterangan":
                    "SAP harus sudah terdaftar di menu Users"
            },

            {
                "Kolom": "Kategori",
                "Keterangan":
                    "IOR1 / IOR2 / IOR3 / IPN1 / IPM1"
            },

            {
                "Kolom": "Mulai",
                "Keterangan":
                    "Boleh dikosongkan, otomatis mengikuti kategori"
            },

            {
                "Kolom": "Selesai",
                "Keterangan":
                    "Boleh dikosongkan, otomatis mengikuti kategori"
            },

            {
                "Kolom": "Jam",
                "Keterangan":
                    "Boleh dikosongkan, otomatis mengikuti kategori"
            },

            {
                "Kolom": "Keterangan",
                "Keterangan":
                    "Keterangan overtime"
            },

            {
                "Kolom": "Aturan",
                "Keterangan":
                    "4 jam menjadi 3.5 jam, 11 jam menjadi 10.5 jam"
            },

            {
                "Kolom": "Konversi",
                "Keterangan":
                    "Tidak perlu diisi, sistem menghitung otomatis"
            }

        ];


        const instructionSheet =
            XLSX.utils.json_to_sheet(
                instructionData
            );


        instructionSheet["!cols"] = [

            { wch: 20 },

            { wch: 70 }

        ];


        XLSX.utils.book_append_sheet(
            workbook,
            instructionSheet,
            "Petunjuk"
        );


        XLSX.writeFile(
            workbook,
            "Template_Input_Overtime.xlsx"
        );


    } catch (error) {

        console.error(
            "Download template error:",
            error
        );


        alert(
            "Template Excel gagal dibuat."
        );

    }

}


/* =====================================================
   HAPUS DATA TERPILIH
===================================================== */

if (deleteSelectedBtn) {

    deleteSelectedBtn.addEventListener(
        "click",
        async () => {

            const selectedIds =
                getSelectedIds();


            if (!selectedIds.length) {

                alert(
                    "Silakan pilih data yang ingin dihapus."
                );

                return;

            }


            const confirmed =
                confirm(
                    `Apakah Anda yakin ingin menghapus ${selectedIds.length} data overtime?`
                );


            if (!confirmed) {
                return;
            }


            try {

                deleteSelectedBtn.disabled =
                    true;


                deleteSelectedBtn.textContent =
                    "⏳ Menghapus...";


                await Promise.all(

                    selectedIds.map(
                        id =>
                            remove(
                                ref(
                                    db,
                                    "overtime/" + id
                                )
                            )
                    )

                );


                window.selectedOvertimeIds =
                    [];


                resetCheckboxState();


                if (msg) {

                    showMsg(
                        msg,
                        `${selectedIds.length} data overtime berhasil dihapus.`,
                        "ok"
                    );

                }


                render();

            } catch (error) {

                console.error(
                    "Hapus massal error:",
                    error
                );


                alert(
                    "Terjadi kesalahan saat menghapus data."
                );

            } finally {

                deleteSelectedBtn.disabled =
                    false;


                deleteSelectedBtn.textContent =
                    "🗑️ Hapus Terpilih";

            }

        }
    );

}


/* =====================================================
   EDIT / HAPUS SATU DATA
===================================================== */

if (rows) {

    rows.addEventListener(
        "click",
        async e => {

            const ed =
                e.target.dataset.edit;


            const del =
                e.target.dataset.del;


            /* =========================================
               HAPUS
            ========================================== */

            if (del) {

                if (
                    confirm(
                        "Hapus data overtime ini?"
                    )
                ) {

                    await remove(
                        ref(
                            db,
                            "overtime/" + del
                        )
                    );


                    window.selectedOvertimeIds =

                        (
                            window.selectedOvertimeIds ||
                            []
                        ).filter(
                            id =>
                                id !== del
                        );


                    updateSelectedCount();

                }


                return;

            }


            /* =========================================
               EDIT
            ========================================== */

            if (ed) {

                const snapshot =
                    await get(
                        ref(
                            db,
                            "overtime/" + ed
                        )
                    );


                if (
                    !snapshot.exists()
                ) {

                    alert(
                        "Data overtime tidak ditemukan."
                    );

                    return;

                }


                const x =
                    snapshot.val();


                if (editId) {
                    editId.value = ed;
                }


                if (date) {
                    date.value =
                        x?.date || "";
                }


                if (userSap) {
                    userSap.value =
                        x?.userSap || "";
                }


                if (category) {
                    category.value =
                        x?.category || "";
                }


                if (start) {
                    start.value =
                        x?.start || "";
                }


                if (end) {
                    end.value =
                        x?.end || "";
                }


                if (hours) {
                    hours.value =
                        x?.hours || 0;
                }


                if (conversionHours) {

                    conversionHours.value =
                        getConversionHours(x);

                }


                if (note) {
                    note.value =
                        x?.note || "";
                }


                window.scrollTo({
                    top: 0,
                    behavior: "smooth"
                });

            }

        }
    );

}
