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
   MODE FORM
===================================================== */

let isEditMode = false;


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
   NORMALISASI ANGKA
===================================================== */

function normalizeNumber(value) {

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


    let text =
        String(value)
            .trim();


    /*
     * Dukungan angka Indonesia:
     *
     * 0,5
     * 1,5
     * 2,5
     */

    text =
        text.replace(",", ".");


    const number =
        Number(text);


    return Number.isFinite(number)
        ? number
        : 0;

}


/* =====================================================
   CEK ANGKA VALID
===================================================== */

function isValidNumber(value) {

    return (
        typeof value === "number" &&
        Number.isFinite(value)
    );

}


/* =====================================================
   BANDINGKAN ANGKA
===================================================== */

function sameNumber(
    a,
    b
) {

    return (
        Math.abs(
            Number(a) - Number(b)
        ) < 0.000001
    );

}


/* =====================================================
   HITUNG JAM OVERTIME
===================================================== */

function calculateHours(value) {

    const total =
        normalizeNumber(value);


    /*
     * 4 jam -> 3.5 jam
     */

    if (
        sameNumber(
            total,
            4
        )
    ) {

        return 3.5;

    }


    /*
     * 11 jam -> 10.5 jam
     */

    if (
        sameNumber(
            total,
            11
        )
    ) {

        return 10.5;

    }


    /*
     * Contoh:
     *
     * 0.5 -> 0.5
     * 1   -> 1
     * 1.5 -> 1.5
     * 2   -> 2
     */

    return total;

}


/* =====================================================
   HITUNG KONVERSI JAM
===================================================== */

function calculateConversionHours(value) {

    const total =
        normalizeNumber(value);


    /*
     * ATURAN KONVERSI
     *
     * 0.5 -> 0.75
     * 1   -> 1.5
     * 1.5 -> 2.5
     * 2   -> 3.5
     * 3   -> 5.5
     * 3.5 -> 6.5
     * 4   -> 7.5
     * 5   -> 9.5
     * 6   -> 11.5
     * 7   -> 14
     * 8   -> 17
     */

    const conversionRules = [

        {
            hours: 0.5,
            conversion: 0.75
        },

        {
            hours: 1,
            conversion: 1.5
        },

        {
            hours: 1.5,
            conversion: 2.5
        },

        {
            hours: 2,
            conversion: 3.5
        },

        {
            hours: 3,
            conversion: 5.5
        },

        {
            hours: 3.5,
            conversion: 6.5
        },

        {
            hours: 4,
            conversion: 7.5
        },

        {
            hours: 5,
            conversion: 9.5
        },

        {
            hours: 6,
            conversion: 11.5
        },

        {
            hours: 7,
            conversion: 14
        },

        {
            hours: 8,
            conversion: 17
        }

    ];


    const found =
        conversionRules.find(
            rule =>
                sameNumber(
                    rule.hours,
                    total
                )
        );


    if (found) {

        return found.conversion;

    }


    /*
     * Jika tidak ada aturan,
     * kembalikan nilai jam.
     */

    return total;

}


/* =====================================================
   HITUNG DATA JAM + KONVERSI
===================================================== */

function calculateOvertimeValues(
    value
) {

    const rawHours =
        normalizeNumber(
            value
        );


    const finalHours =
        calculateHours(
            rawHours
        );


    const finalConversion =
        calculateConversionHours(
            finalHours
        );


    return {

        hours:
            finalHours,

        conversionHours:
            finalConversion

    };

}


/* =====================================================
   AMBIL KONVERSI DATA
===================================================== */

function getConversionHours(x) {

    const databaseHours =
        normalizeNumber(
            x?.hours
        );


    /*
     * Selalu hitung berdasarkan hours.
     *
     * Dengan cara ini data lama yang memiliki
     * conversionHours salah juga ikut diperbaiki
     * saat ditampilkan.
     */

    return calculateConversionHours(
        databaseHours
    );

}


/* =====================================================
   FORMAT ANGKA
===================================================== */

function formatNumber(value) {

    const number =
        normalizeNumber(value);


    return Number(
        number.toFixed(2)
    ).toString();

}


/* =====================================================
   UPDATE MODE FORM
===================================================== */

function updateFormMode() {

    if (!otForm) {
        return;
    }


    if (isEditMode) {

        otForm.classList.add(
            "edit-mode"
        );

    } else {

        otForm.classList.remove(
            "edit-mode"
        );

    }

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


            /*
             * Kategori tidak mengubah data
             * saat edit.
             */

            if (isEditMode) {

                return;

            }


            start.value =
                x.start;


            end.value =
                x.end;


            const result =
                calculateOvertimeValues(
                    x.hours
                );


            hours.value =
                formatNumber(
                    result.hours
                );


            conversionHours.value =
                formatNumber(
                    result.conversionHours
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

            /*
             * Jika kosong,
             * konversi ikut dikosongkan.
             */

            if (
                hours.value === ""
            ) {

                if (conversionHours) {

                    conversionHours.value =
                        "";

                }

                return;

            }


            const inputHours =
                normalizeNumber(
                    hours.value
                );


            /*
             * Jika bukan angka valid,
             * jangan menampilkan error.
             *
             * Tunggu sampai user selesai mengetik.
             */

            if (
                !isValidNumber(
                    inputHours
                )
            ) {

                if (conversionHours) {

                    conversionHours.value =
                        "";

                }

                return;

            }


            /*
             * INPUT BARU DAN EDIT:
             *
             * Keduanya menggunakan aturan
             * konversi otomatis.
             */

            const result =
                calculateOvertimeValues(
                    inputHours
                );


            /*
             * Update hours juga.
             *
             * Contoh:
             *
             * input 4
             * menjadi 3.5
             */

            if (
                sameNumber(
                    inputHours,
                    4
                )
            ) {

                hours.value =
                    formatNumber(
                        result.hours
                    );

            }


            /*
             * 0.5 -> 0.75
             */

            if (conversionHours) {

                conversionHours.value =
                    formatNumber(
                        result.conversionHours
                    );

            }

        }
    );

}


/* =====================================================
   KONVERSI JAM BERUBAH
===================================================== */

if (conversionHours) {

    conversionHours.addEventListener(
        "input",
        () => {

            /*
             * Konversi tidak menjadi sumber
             * perhitungan.
             *
             * Nilai akan selalu mengikuti
             * jumlah jam.
             */

            const inputHours =
                normalizeNumber(
                    hours?.value
                );


            if (
                inputHours > 0
            ) {

                const result =
                    calculateOvertimeValues(
                        inputHours
                    );


                conversionHours.value =
                    formatNumber(
                        result.conversionHours
                    );

            }

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


                    /*
                     * Jam yang ditampilkan juga
                     * mengikuti aturan sistem.
                     */

                    const displayHours =
                        calculateHours(
                            x?.hours || 0
                        );


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
                                    displayHours
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
   UPDATE JUMLAH CHECKBOX
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


            /*
             * Ambil jam dari input.
             */

            const rawHours =
                normalizeNumber(
                    hours?.value
                );


            /*
             * Validasi jam.
             */

            if (
                !isValidNumber(
                    rawHours
                ) ||
                rawHours <= 0
            ) {

                alert(
                    "Jumlah jam overtime harus lebih dari 0."
                );

                return;

            }


            /*
             * SELALU hitung ulang jam dan konversi.
             *
             * Tidak peduli INPUT BARU atau EDIT.
             */

            const overtime =
                calculateOvertimeValues(
                    rawHours
                );


            const inputHours =
                overtime.hours;


            const inputConversion =
                overtime.conversionHours;


            /*
             * VALIDASI FINAL.
             */

            if (
                !isValidNumber(
                    inputHours
                ) ||
                inputHours <= 0
            ) {

                alert(
                    "Jumlah jam overtime tidak valid."
                );

                return;

            }


            if (
                !isValidNumber(
                    inputConversion
                ) ||
                inputConversion <= 0
            ) {

                alert(
                    "Konversi jam tidak valid."
                );

                return;

            }


            /*
             * Pastikan tanggal ada.
             */

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


            /*
             * DATA FINAL
             */

            const data = {

                date:
                    finalDate,

                start:
                    start?.value || "",

                end:
                    end?.value || "",

                hours:
                    inputHours,

                conversionHours:
                    inputConversion,

                userSap:
                    userSap?.value || "",

                category:
                    category?.value || "",

                note:
                    note?.value.trim() || "",

                updatedAt:
                    Date.now()

            };


            /*
             * ID
             */

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


            /*
             * SIMPAN FIREBASE
             */

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

                    isEditMode
                        ? "Data overtime berhasil diperbarui."
                        : "Data overtime berhasil disimpan.",

                    "ok"
                );

            }


            /*
             * Kembali ke mode input baru.
             */

            reset();

        }
    );

}


/* =====================================================
   RESET FORM
===================================================== */

function reset() {

    isEditMode = false;


    if (otForm) {

        otForm.reset();

    }


    if (editId) {

        editId.value = "";

    }


    if (conversionHours) {

        conversionHours.value = "";

    }


    updateFormMode();

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


    for (
        const name of names
    ) {

        const target =
            normalizeHeader(
                name
            );


        const found =
            keys.find(
                key =>
                    normalizeHeader(
                        key
                    ) === target
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
===================================================== */

function formatExcelDate(value) {

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


        if (!stringValue) {
            return "";
        }


        let match =
            stringValue.match(
                /^(\d{4})-(\d{1,2})-(\d{1,2})$/
            );


        if (match) {

            return buildDateString(
                Number(match[1]),
                Number(match[2]),
                Number(match[3])
            );

        }


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


            return buildDateString(
                year,
                month,
                day
            );

        }


        match =
            stringValue.match(
                /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/
            );


        if (match) {

            return buildDateString(
                Number(match[3]),
                Number(match[1]),
                Number(match[2])
            );

        }


        match =
            stringValue.match(
                /^(\d{1,2})-(\d{1,2})-(\d{4})$/
            );


        if (match) {

            return buildDateString(
                Number(match[3]),
                Number(match[2]),
                Number(match[1])
            );

        }


        return stringValue;

    }


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

                return buildDateString(
                    Number(parsed.y),
                    Number(parsed.m),
                    Number(parsed.d)
                );

            }

        }

    }


    if (
        value instanceof Date &&
        !isNaN(
            value.getTime()
        )
    ) {

        return buildDateString(
            value.getFullYear(),
            value.getMonth() + 1,
            value.getDate()
        );

    }


    return String(
        value
    ).trim();

}


/* =====================================================
   BUILD DATE
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


        const match =
            stringValue.match(
                /^(\d{1,2}):(\d{1,2})/
            );


        if (match) {

            const hour =
                Number(
                    match[1]
                );


            const minute =
                Number(
                    match[2]
                );


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


        if (
            totalMinutes < 0
        ) {

            totalMinutes +=
                24 * 60;

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
        !isNaN(
            value.getTime()
        )
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


    return String(
        value
    ).trim();

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


    let stringValue =
        String(value)
            .trim();


    /*
     * 0,5 -> 0.5
     */

    stringValue =
        stringValue.replace(
            ",",
            "."
        );


    /*
     * Angka normal:
     *
     * 0.5
     * 1
     * 1.5
     * 2
     */

    const number =
        Number(
            stringValue
        );


    if (
        Number.isFinite(number)
    ) {

        return number;

    }


    /*
     * Format:
     *
     * 2:30 -> 2.5
     */

    const match =
        stringValue.match(
            /^(\d+(?:\.\d+)?)\s*:\s*(\d+)$/
        );


    if (match) {

        return (

            Number(match[1]) +

            Number(match[2]) / 60

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


        for (
            let i = 0;
            i < dataExcel.length;
            i++
        ) {

            const row =
                dataExcel[i];


            try {

                const rowDate =
                    getExcelValue(
                        row,
                        [
                            "Tanggal",
                            "Date",
                            "Tgl"
                        ]
                    );


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


                const rowCategory =
                    getExcelValue(
                        row,
                        [
                            "Kategori",
                            "Kategori Overtime",
                            "Category"
                        ]
                    );


                let rowStart =
                    getExcelValue(
                        row,
                        [
                            "Mulai",
                            "Jam Mulai",
                            "Start"
                        ]
                    );


                let rowEnd =
                    getExcelValue(
                        row,
                        [
                            "Selesai",
                            "Jam Selesai",
                            "End"
                        ]
                    );


                const rowHours =
                    getExcelValue(
                        row,
                        [
                            "Jam",
                            "Jumlah Jam",
                            "Hours"
                        ]
                    );


                const rowNote =
                    getExcelValue(
                        row,
                        [
                            "Keterangan",
                            "Note",
                            "Catatan"
                        ]
                    );


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


                const finalDate =
                    formatExcelDate(
                        rowDate
                    );


                if (!finalDate) {

                    throw new Error(
                        "Tanggal kosong/tidak valid"
                    );

                }


                if (
                    !/^\d{4}-\d{2}-\d{2}$/
                        .test(
                            finalDate
                        )
                ) {

                    throw new Error(
                        `Format tanggal tidak valid: ${finalDate}`
                    );

                }


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


                rowStart =
                    formatExcelTime(
                        rowStart
                    );


                if (!rowStart) {

                    rowStart =
                        categoryData.start;

                }


                rowEnd =
                    formatExcelTime(
                        rowEnd
                    );


                if (!rowEnd) {

                    rowEnd =
                        categoryData.end;

                }


                let rawHours =
                    parseExcelNumber(
                        rowHours
                    );


                /*
                 * Jika jam kosong,
                 * gunakan jam kategori.
                 */

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


                /*
                 * HITUNG JAM FINAL
                 */

                const overtime =
                    calculateOvertimeValues(
                        rawHours
                    );


                const finalHours =
                    overtime.hours;


                const finalConversion =
                    overtime.conversionHours;


                /*
                 * PENGAMAN KHUSUS 0.5
                 */

                if (
                    sameNumber(
                        finalHours,
                        0.5
                    )
                ) {

                    if (
                        !sameNumber(
                            finalConversion,
                            0.75
                        )
                    ) {

                        throw new Error(
                            "Konversi 0.5 jam harus 0.75"
                        );

                    }

                }


                const finalNote =
                    String(
                        rowNote || ""
                    ).trim();


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

            excelFile.value =
                "";

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

            {
                wch: 15
            },

            {
                wch: 15
            },

            {
                wch: 15
            },

            {
                wch: 12
            },

            {
                wch: 12
            },

            {
                wch: 10
            },

            {
                wch: 30
            }

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
                    "Masukkan jumlah jam, contoh 0.5 atau 0,5"
            },

            {
                "Kolom": "Keterangan",
                "Keterangan":
                    "Keterangan overtime"
            },

            {
                "Kolom": "Konversi",
                "Keterangan":
                    "Dihitung otomatis berdasarkan jumlah jam"
            },

            {
                "Kolom": "Aturan",
                "Keterangan":
                    "0.5 jam = 0.75; 1 jam = 1.5; 1.5 jam = 2.5; 2 jam = 3.5; 3 jam = 5.5; 3.5 jam = 6.5; 4 jam = 7.5; 5 jam = 9.5; 6 jam = 11.5; 7 jam = 14; 8 jam = 17"
            }

        ];


        const instructionSheet =
            XLSX.utils.json_to_sheet(
                instructionData
            );


        instructionSheet["!cols"] = [

            {
                wch: 20
            },

            {
                wch: 100
            }

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


                /*
                 * AKTIFKAN MODE EDIT
                 */

                isEditMode =
                    true;


                updateFormMode();


                if (editId) {

                    editId.value =
                        ed;

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


                /*
                 * Ambil hours dari database.
                 */

                const existingHours =
                    normalizeNumber(
                        x?.hours
                    );


                if (hours) {

                    hours.value =
                        formatNumber(
                            existingHours
                        );

                }


                /*
                 * Jangan mengambil conversionHours
                 * lama jika nilainya tidak sesuai.
                 *
                 * Hitung ulang dari hours.
                 */

                const calculated =
                    calculateOvertimeValues(
                        existingHours
                    );


                if (hours) {

                    hours.value =
                        formatNumber(
                            calculated.hours
                        );

                }


                if (conversionHours) {

                    conversionHours.value =
                        formatNumber(
                            calculated.conversionHours
                        );

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
